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
const summaryService = require('../../services/summaryService');


describe('SummaryService with RAG', () => {
  const mockSessionData = {
      _id: 'session123',
      patient: { patientId: 'pat_789' }, 
      transcriptions: [{ status: 'completed', transcriptionText: 'Patient has a cough.' }], 
  };
  const mockContext = "Patient History Summary:\n- Known Diagnoses: Asthma";

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockMongooseChain.exec.mockResolvedValue(mockSessionData);
    
    mockGroqCreate.mockResolvedValue({
        choices: [{ message: { content: '{ "chief_complaint": "Test", "history_of_present_illness": "Test", "assessment": "Test", "plan": "Test", "patientSummary": "Test", "prescriptions": [], "clinicalAlerts": [] }' } }]
    });
    
    graphService.retrievePatientContext.mockResolvedValue('');
  });

  it('should retrieve patient context and augment the summary prompt', async () => {
    graphService.retrievePatientContext.mockResolvedValue(mockContext);

    await summaryService.generateSummary('session123', 'summary456');

    expect(graphService.retrievePatientContext).toHaveBeenCalledWith('pat_789');

    const promptSentToLLM = mockGroqCreate.mock.calls[0][0].messages[0].content; 
    expect(promptSentToLLM).toContain("Patient's Clinical History (from RAG):");
    expect(promptSentToLLM).toContain("- Known Diagnoses: Asthma");
    expect(promptSentToLLM).toContain("Transcript: Patient has a cough.");
  });

  it('should not include context in the prompt if none is found', async () => {
    await summaryService.generateSummary('session123', 'summary456');

    const promptSentToLLM = mockGroqCreate.mock.calls[0][0].messages[0].content;
    expect(promptSentToLLM).not.toContain("Patient's Clinical History (from RAG):");
    expect(promptSentToLLM).toContain("Transcript: Patient has a cough.");
  });
  
  it('should throw an error if no completed transcriptions are found', async () => {
      const mockSessionEmptyTranscriptions = {
          ...mockSessionData,
          transcriptions: [{ status: 'processing', transcriptionText: '' }],
      };
      
      mockMongooseChain.exec.mockResolvedValue(mockSessionEmptyTranscriptions);

      await expect(summaryService.generateSummary('session123', 'summary456'))
        .rejects
        .toThrow('No completed transcriptions found');
  });
});
