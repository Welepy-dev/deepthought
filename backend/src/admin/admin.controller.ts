import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { JwtUser } from '../auth/interfaces/jwt-user.interface';
import { AdminService } from './admin.service';
import {
  AdminUpdateUserDto,
  AdminUsersQueryDto,
  BanUserDto,
  CreateUserDto,
  UpdateRoleDto,
} from './dto/admin.dto';

/**
 * Controller de administração.
 *
 * Todas as rotas exigem JWT válido e utilizador não banido. O role
 * exigido é ADMIN por defeito (nível de classe); list/ban/unban aceitam
 * também MODERATOR via override de `@Roles()` no método. Alterar role e
 * apagar utilizador ficam sempre restritos a ADMIN.
 */
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(
    /**
     * Serviço que contém a lógica de negócio e acesso à base de dados para
     * operações administrativas.
     */
    private readonly adminService: AdminService,
  ) {}

  /**
   * Lista utilizadores para administração.
   *
   * Exemplo de uso de `@CurrentUser()` completo: o admin autenticado fica
   * disponível com tipagem `JwtUser`, útil para auditoria/logs no futuro.
   */
  @Get('users')
  @Roles(Role.MODERATOR, Role.ADMIN)
  findAll(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: AdminUsersQueryDto,
    @CurrentUser() admin: JwtUser,
  ) {
    void admin;
    return this.adminService.findAll(query);
  }

  /**
   * Cria manualmente um utilizador.
   *
   * O pipe valida e remove propriedades não declaradas no DTO.
   */
  @Post('users')
  create(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    dto: CreateUserDto,
  ) {
    return this.adminService.create(dto);
  }

  /**
   * Actualiza campos administrativos de um utilizador.
   */
  @Patch('users/:id')
  update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    dto: AdminUpdateUserDto,
  ) {
    return this.adminService.update(id, dto);
  }

  /**
   * Remove permanentemente um utilizador.
   *
   * Exemplo de uso de `@CurrentUser('sub')`: injecta apenas o ID do admin,
   * evitando passar o objecto inteiro quando só precisamos do subject.
   */
  @Delete('users/:id')
  remove(@Param('id') id: string, @CurrentUser('sub') adminId: string) {
    return this.adminService.remove(id, adminId);
  }

  /**
   * Bane um utilizador.
   *
   * O service impede que o admin se bana a si próprio.
   */
  @Patch('users/:id/ban')
  @Roles(Role.MODERATOR, Role.ADMIN)
  ban(
    @Param('id') id: string,
    @CurrentUser('sub') adminId: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    dto: BanUserDto,
  ) {
    return this.adminService.ban(id, adminId, dto);
  }

  /**
   * Remove o ban de um utilizador.
   */
  @Patch('users/:id/unban')
  @Roles(Role.MODERATOR, Role.ADMIN)
  unban(@Param('id') id: string) {
    return this.adminService.unban(id);
  }

  /**
   * Altera o role de um utilizador.
   *
   * O service impede que o admin altere o próprio role.
   */
  @Patch('users/:id/role')
  updateRole(
    @Param('id') id: string,
    @CurrentUser('sub') adminId: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    dto: UpdateRoleDto,
  ) {
    return this.adminService.updateRole(id, adminId, dto);
  }
}
