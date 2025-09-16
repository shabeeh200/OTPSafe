import request from 'supertest';
import app from '../../index';

describe('POST /analyze/analyze-sms', () => {
  it('should return 200 and a valid response for a normal SMS', async () => {
    const res = await request(app)
      .post('/analyze/analyze-sms')
      .send({ message: 'Your OTP is 123456', sender: 'Bank', country: 'PK' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('isScam');
    expect(res.body).toHaveProperty('confidence');
    expect(res.body).toHaveProperty('redacted');
  });

  it('should return 400 for missing message field', async () => {
    const res = await request(app)
      .post('/analyze/analyze-sms')
      .send({ sender: 'Bank' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should rate limit after 10 requests per minute', async () => {
    for (let i = 0; i < 10; i++) {
      await request(app)
        .post('/analyze/analyze-sms')
        .send({ message: 'Test message' });
    }
    const res = await request(app)
      .post('/analyze/analyze-sms')
      .send({ message: 'Test message' });
    expect(res.status).toBe(429);
  });
});