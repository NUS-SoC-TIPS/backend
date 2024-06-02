import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import firebase from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  constructor(
    private readonly logger: Logger,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit(): void {
    if (this.configService.get<string>('NODE_ENV') === 'test') {
      this.logger.warn(
        'Firebase is not initializing due to being in test environment',
        FirebaseService.name,
      );
      return;
    }
    try {
      firebase.initializeApp({
        credential: firebase.credential.cert({
          projectId: this.configService.get<string>('FIREBASE_PROJECT_ID'),
          clientEmail: this.configService.get<string>('FIREBASE_CLIENT_EMAIL'),
          privateKey: this.configService
            .get<string>('FIREBASE_PRIVATE_KEY')
            ?.replace(/\\n/g, '\n'),
        }),
      });
    } catch (e) {
      this.logger.error(
        'Failed to initialize app. It is likely due to some NodeJS process-level caching. Try to restart this on a new process.',
        e instanceof Error ? e.stack : undefined,
        FirebaseService.name,
      );
      throw e;
    }
  }

  verifyToken(token: string): Promise<string> {
    return firebase
      .auth()
      .verifyIdToken(token)
      .then((decodedToken) => decodedToken.uid)
      .catch((e: unknown) => {
        this.logger.error(
          'Failed to verify token',
          e instanceof Error ? e.stack : undefined,
          FirebaseService.name,
        );
        throw e;
      });
  }
}
