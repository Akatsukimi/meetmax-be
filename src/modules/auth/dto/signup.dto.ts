import { IsString, IsEmail, IsNotEmpty, Length } from 'class-validator';

export class SignupDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 100)
  password: string;

  @IsString()
  @Length(1, 50)
  username: string;

  @IsString()
  gender: string;
}
