import {
  IsString,
  IsOptional,
  IsEnum,
  IsUrl,
  MaxLength,
  MinLength,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ResourceType } from '@prisma/client';
import { Type } from 'class-transformer';

/**
 * DTO para criar um novo recurso partilhado.
 * POST /resources
 */
export class CreateResourceDto {
  /**
   * Título descritivo do recurso.
   * @example "Guia completo de ft_printf"
   */
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  title!: string;

  /**
   * Descrição opcional do recurso.
   * @example "Tutorial passo-a-passo para implementar ft_printf"
   */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  /**
   * URL do recurso (link, PDF, vídeo, etc.).
   * @example "https://github.com/user/ft_printf_guide"
   */
  @IsUrl({}, { message: 'url must be a valid URL' })
  url!: string;

  /**
   * Tipo do recurso.
   * Valores: LINK, PDF, VIDEO, ARTICLE, GITHUB, OTHER
   */
  @IsEnum(ResourceType, {
    message: `type must be one of: ${Object.values(ResourceType).join(', ')}`,
  })
  type!: ResourceType;

  /**
   * ID do projecto ao qual o recurso pertence.
   * @example "clx1abc123..."
   */
  @IsString()
  projectId!: string;
}

/**
 * DTO para query parameters de listagem de recursos.
 * GET /resources
 */
export class ResourcesQueryDto {
  /**
   * Filtrar por projecto (ID do projecto).
   */
  @IsOptional()
  @IsString()
  projectId?: string;

  /**
   * Filtrar por tipo de recurso.
   */
  @IsOptional()
  @IsEnum(ResourceType)
  type?: ResourceType;

  /** Página (começa em 1) */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  /** Resultados por página */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}