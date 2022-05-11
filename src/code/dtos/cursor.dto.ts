import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, Min, ValidateNested } from 'class-validator';

class Position {
  @IsInt()
  @IsNotEmpty()
  @Min(0)
  row: number;

  @IsInt()
  @IsNotEmpty()
  @Min(0)
  column: number;
}

export class CursorDto {
  @ValidateNested()
  @Type(() => Position)
  start: Position;

  @ValidateNested()
  @Type(() => Position)
  end: Position;
}
