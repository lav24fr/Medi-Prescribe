
jest.mock('../../config', () => ({
    groqApiKey: 'MOCKED_KEY', 
    graphDb: { uri: 'bolt://mock:7687', user: 'u', password: 'p' }, 
}));

const mockGroqCreate = jest.fn();

jest.mock('groq-sdk', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockGroqCreate
      }
    }
  }));
});

const mockMongooseChain = {
    populate: jest.fn().mockReturnThis(), 
    exec: jest.fn(),
};

const mockSessionModel = {
    findById: jest.fn().mockReturnValue(mockMongooseChain),
};

jest.mock('../../models/session', () => mockSessionModel);


jest.mock('../../services/graphService');
const graphService = require('../../services/graphService');
const questionService = require('../../services/questionService');


describe('QuestionService with RAG', () => {
  const mockSessionData = {
      _id: 'session123',
      patient: { patientId: 'pat_789' },
      transcriptions: [{ status: 'completed', transcriptionText: 'Patient feels tired.' }], 
  };
  
  const mockSessionDataAnonymous = {
      _id: 'session456',
      patient: null,
      transcriptions: [{ status: 'completed', transcriptionText: 'Anonymous talk.' }], 
  };
  
  const mockContext = "PATIENT HISTORY CONTEXT (from Knowledge Graph):\n- Known Diagnoses: Migraine";

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockMongooseChain.exec.mockResolvedValue(mockSessionData);
    
    mockGroqCreate.mockResolvedValue({
      choices: [{ message: { content: '{"questions":[]}' } }]
    });
    
    graphService.retrievePatientContext.mockResolvedValue(mockContext);
  });

  it('should retrieve patient context and augment all question prompts', async () => {
    await questionService.generateReflexiveQuestions('session123', 'Patient feels tired.');

    expect(graphService.retrievePatientContext).toHaveBeenCalledWith('pat_789');
    
    expect(mockGroqCreate).toHaveBeenCalledTimes(3);

    const prompts = mockGroqCreate.mock.calls.map(call => call[0].messages[0].content);
    prompts.forEach(prompt => {
        expect(prompt).toContain(mockContext);
    });
  });

  it('should throw an error if no completed transcriptions are found', async () => {
      const mockSessionEmptyTranscriptions = {
          ...mockSessionData,
          transcriptions: [{ status: 'processing', transcriptionText: 'Processing text...' }],
      };
      
      mockMongooseChain.exec.mockResolvedValue(mockSessionEmptyTranscriptions);

      await expect(questionService.generateReflexiveQuestions('session123', 'Patient feels tired.'))
        .rejects
        .toThrow('No completed transcriptions found');
  });
  
  it('should not retrieve context if patient is null on session', async () => {
    mockMongooseChain.exec.mockResolvedValue(mockSessionDataAnonymous);
    
    await questionService.generateReflexiveQuestions('session456', 'Anonymous talk.');

    expect(graphService.retrievePatientContext).not.toHaveBeenCalled();

    const clinicalPrompt = mockGroqCreate.mock.calls[0][0].messages[0].content;
    
    expect(clinicalPrompt).not.toContain("PATIENT HISTORY CONTEXT");
    expect(clinicalPrompt).toContain('Transcript: Anonymous talk.'); 
  });
});
