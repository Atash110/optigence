/**
 * Voice Transcription API Route for OptiMail
 */

import { NextApiRequest, NextApiResponse } from 'next';
import VoiceService from '../../../lib/voice';
import formidable from 'formidable';
import fs from 'fs';

// Disable body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const voiceService = new VoiceService();

  try {
    // Parse the multipart form data
    const form = formidable({
      uploadDir: './temp',
      keepExtensions: true,
      maxFileSize: 25 * 1024 * 1024, // 25MB limit
    });

    const [fields, files] = await form.parse(req);
    const audioFile = Array.isArray(files.audio) ? files.audio[0] : files.audio;

    if (!audioFile) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // Extract options from fields
    const options = {
      language: Array.isArray(fields.language) ? fields.language[0] : fields.language || 'en',
      punctuate: fields.punctuate === 'true',
      generateEmail: fields.generateEmail === 'true',
      recipient: Array.isArray(fields.recipient) ? fields.recipient[0] : fields.recipient,
      subject: Array.isArray(fields.subject) ? fields.subject[0] : fields.subject,
    };

    let result: any = {};

    if (options.generateEmail) {
      // Convert speech to email draft
      const emailResult = await voiceService.speechToEmailDraft(audioFile.filepath, {
        recipient: options.recipient,
        subject: options.subject
      });
      
      result = {
        transcript: emailResult.transcript,
        emailDraft: emailResult.emailDraft,
        success: true
      };
    } else {
      // Just transcribe the audio
      const transcript = await voiceService.transcribeAudio(audioFile.filepath, {
        language: options.language,
        punctuate: options.punctuate
      });

      result = {
        transcript,
        success: true
      };
    }

    // Cleanup temp file
    if (fs.existsSync(audioFile.filepath)) {
      fs.unlinkSync(audioFile.filepath);
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('Voice transcription error:', error);
    res.status(500).json({ 
      error: 'Failed to process audio',
      message: error instanceof Error ? error.message : String(error)
    });
  }
}
