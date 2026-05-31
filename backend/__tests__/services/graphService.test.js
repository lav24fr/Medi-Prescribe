jest.mock('../../config', () => ({
    graphDb: {
      uri: 'bolt://localhost:7687',
      user: 'neo4j',
      password: 'password',
    },
}));

jest.mock('neo4j-driver');
const { _mockRun, _mockExecuteWrite } = require('neo4j-driver');
const graphService = require('../../services/graphService');

describe('GraphService', () => {
  beforeEach(() => {
    _mockRun.mockClear();
    _mockExecuteWrite.mockClear();
  });

  describe('buildKnowledgeGraph', () => {
    it('should run correct Cypher queries to build the graph for a patient session', async () => {
      const sessionData = {
        sessionId: 'sess_123',
        doctorId: 'doc_456',
        doctorName: 'Dr. Strange',
        startTime: new Date().toISOString(),
      };
      const patientData = {
        patientId: 'pat_789',
        firstName: 'John',
        lastName: 'Doe',
      };
      const extractedData = {
        diagnoses: [{ condition: 'Hypertension', icd10Code: 'I10', confidence: 95 }],
        symptoms: ['Headache', 'Dizziness'],
      };

      await graphService.buildKnowledgeGraph(sessionData, patientData, extractedData);

      expect(_mockExecuteWrite).toHaveBeenCalledTimes(1);

      expect(_mockRun).toHaveBeenCalledTimes(1 + 1 + 1 + 1 + 1 + 2 + 2);

      const patientQueryCall = _mockRun.mock.calls.find(call => call[0].includes('MERGE (p:Patient'));
      expect(patientQueryCall[0]).toContain('MERGE (p)-[:HAS_SESSION]->(s:Session {sessionId: $sessionId})');
      expect(patientQueryCall[1]).toEqual({
        patientId: 'pat_789',
        firstName: 'John',
        lastName: 'Doe',
        sessionId: 'sess_123',
        doctorId: 'doc_456',
      });
    });
  });

  describe('retrievePatientContext', () => {
    it('should retrieve and format patient context from the graph', async () => {
      const mockRecord = {
        get: jest.fn(key => {
          switch (key) {
            case 'p': return { properties: { firstName: 'Jane', lastName: 'Doe' } };
            case 'sessions': return ['sess_abc', 'sess_def'];
            case 'diagnoses': return ['Diabetes', 'Asthma'];
            case 'symptoms': return ['Fatigue'];
            case 'medications': return [];
            case 'allergies': return [];
            default: return null;
          }
        }),
      };
      _mockRun.mockResolvedValueOnce({ records: [mockRecord] })
             .mockResolvedValueOnce({ records: [] });

      const context = await graphService.retrievePatientContext('pat_999');

      expect(_mockRun).toHaveBeenCalledWith(expect.stringContaining('MATCH (p:Patient {patientId: $patientId})'), { patientId: 'pat_999' });
      expect(context).toContain('Patient History Summary:');
      expect(context).toContain('- Known Diagnoses: Diabetes, Asthma');
      expect(context).toContain('- Previous Sessions: sess_abc, sess_def');
    });

    it('should return an empty string if patient is not found', async () => {
      _mockRun.mockResolvedValue({ records: [] });

      const context = await graphService.retrievePatientContext('pat_not_found');
      expect(context).toBe('');
    });
  });
});