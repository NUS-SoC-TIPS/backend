import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import helmet from 'helmet';
import * as pactum from 'pactum';

import { AppModule } from '../src/app.module';
import { User } from '../src/infra/prisma/generated';
import { PrismaService } from '../src/infra/prisma/prisma.service';
import { createUserAndLogin } from '../src/utils';

// Tests all main user flows
describe('Application (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let user: User;
  let token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(helmet());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    prisma = app.get(PrismaService);
    await app.init();
    await app.listen(3333);
    await prisma.cleanDb();
    const result = await createUserAndLogin(app, '1');
    user = result.user;
    token = result.token;

    pactum.request.setBaseUrl('http://localhost:3333');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Users', () => {
    it('should allow user to get self if JWT is defined', () => {
      pactum
        .spec()
        .get('/users/self')
        .withHeaders({
          Authorization: `Bearer ${token}`,
        })
        .expectStatus(200)
        .expectBody(JSON.parse(JSON.stringify({ ...user, settings: null })));
    });

    it('should throw an error if user tries to get self without JWT', () => {
      pactum.spec().get('/users/self').expectStatus(401);
    });
  });

  describe('Rooms', () => {
    it('should return null when user who is not in room checks for current room', () => {
      pactum
        .spec()
        .get('/rooms')
        .withHeaders({
          Authorization: `Bearer ${token}`,
        })
        .expectStatus(200)
        .expectBody(null);
    });

    it('should allow a user who is not in room to create a new room', () => {
      pactum
        .spec()
        .post('/rooms')
        .withHeaders({
          Authorization: `Bearer ${token}`,
        })
        .expectStatus(201)
        .expectBodyContains('slug')
        .stores('roomSlug', 'slug');
    });

    it('should return current room for user in room', () => {
      pactum
        .spec()
        .get('/rooms')
        .withHeaders({
          Authorization: `Bearer ${token}`,
        })
        .expectStatus(200)
        .expectBodyContains('$S{roomSlug}')
        .expectBodyContains('OPEN');
    });

    it('should not allow a user who is already in room to create a new room', () => {
      pactum
        .spec()
        .post('/rooms')
        .withHeaders({
          Authorization: `Bearer ${token}`,
        })
        .expectStatus(403);
    });
  });
});
