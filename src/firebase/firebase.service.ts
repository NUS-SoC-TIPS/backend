import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import firebase from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    if (this.configService.get('NODE_ENV') === 'test') {
      return;
    }
    firebase.initializeApp({
      credential: firebase.credential.cert({
        projectId: this.configService.get('FIREBASE_PROJECT_ID'),
        clientEmail: this.configService.get('FIREBASE_CLIENT_EMAIL'),
        privateKey: this.configService
          .get('FIREBASE_PRIVATE_KEY')
          ?.replace(/\\n/g, '\n'),
      }),
    });
  }

  verifyToken(token: string): Promise<string> {
    return firebase
      .auth()
      .verifyIdToken(token)
      .then((decodedToken) => decodedToken.uid);
  }
}
