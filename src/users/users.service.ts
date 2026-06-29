import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly usersRepo: Repository<User>) {}

  findByEmail(email: string) { return this.usersRepo.findOne({ where: { email } }); }
  findById(id: string) { return this.usersRepo.findOne({ where: { id } }); }

  async create(email: string, plainPassword: string) {
    const exists = await this.findByEmail(email);
    if (exists) throw new ConflictException('El email ya está registrado');
    const user = this.usersRepo.create({ email, password: await argon2.hash(plainPassword) });
    return this.usersRepo.save(user);
  }

  safeUser(user: User) { return { id: user.id, email: user.email, createdAt: user.createdAt }; }
}
