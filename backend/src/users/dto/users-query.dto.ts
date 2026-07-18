import { IsOptional, IsString, IsInt, IsIn, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export type UsersSortBy = 'level' | 'login' | 'lastSeenAt';
export type SortOrder = 'asc' | 'desc';

export class UsersQueryDto {
  @IsOptional()
  @IsString()
  login?: string;

  @IsOptional()
  @IsIn(['level', 'login', 'lastSeenAt'])
  sortBy?: UsersSortBy = 'level';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: SortOrder = 'desc';

  @IsOptional()
  @IsString()
  campus?: string;

  @IsOptional()
  @IsString()
  coalition?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
