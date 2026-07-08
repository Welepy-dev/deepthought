import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { FriendshipsModule } from '../friendships/friendships.module';
import { ResourcesModule } from '../resources/resources.module';

@Module({
  imports: [PrismaModule, FriendshipsModule, ResourcesModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
