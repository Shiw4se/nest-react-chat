import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('register', () => {
    it('should call authService.register and return the new user', async () => {
      const dto = { username: 'andrew_test', password: 'password123' };
      const expectedResult = { id: '1', username: 'andrew_test' };
      
      mockAuthService.register.mockResolvedValue(expectedResult);

      const result = await authController.register(dto);

      expect(result).toEqual(expectedResult);
      expect(authService.register).toHaveBeenCalledWith(dto.username, dto.password);
    });
  });

  describe('login', () => {
    it('should call authService.login and return the token', async () => {
      const dto = { username: 'andrew_test', password: 'password123' };
      const expectedResult = { access_token: 'mock_jwt_token' };
      
      mockAuthService.login.mockResolvedValue(expectedResult);

      const result = await authController.login(dto);

      expect(result).toEqual(expectedResult);
      expect(authService.login).toHaveBeenCalledWith(dto.username, dto.password);
    });
  });
});