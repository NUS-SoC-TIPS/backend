import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateRoomUserDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsNumber()
  @IsNotEmpty()
  roomId: number;
}
