import { IsString, IsNotEmpty, Max, MaxLength } from 'class-validator';

export class SendMessageDto {
    @IsString()
    @IsNotEmpty()
    room: string;

    @IsString()
    @IsNotEmpty()
    message: string;
}