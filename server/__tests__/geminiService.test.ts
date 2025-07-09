import { getManagerResponse } from '../services/geminiService';

describe('geminiService', () => {
  it('should return a response from Gemini', async () => {
    const response = await getManagerResponse('test prompt');
    expect(response).toBeDefined();
  });
});