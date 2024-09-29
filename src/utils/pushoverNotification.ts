import axios from 'axios';

interface PushoverMessage {
  token: string;
  user: string;
  message: string;
  title?: string;
}

export async function sendPushoverNotification(message: PushoverMessage): Promise<void> {
  try {
    await axios.post('https://api.pushover.net/1/messages.json', message);
  } catch (error) {
    console.error('Error sending Pushover notification:', error);
  }
}