import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { Note } from './note.entity';

@Injectable()
export class NotesService {
  constructor(@InjectRepository(Note) private readonly notes: Repository<Note>) {}

  create(ownerId: string, dto: CreateNoteDto) {
    return this.notes.save(this.notes.create({ ...dto, ownerId }));
  }

  findAll(ownerId: string) {
    return this.notes.find({ where: { ownerId }, order: { createdAt: 'DESC' } });
  }

  async findOne(ownerId: string, id: string) {
    const note = await this.notes.findOne({ where: { id, ownerId } });
    if (!note) throw new NotFoundException('Nota no encontrada');
    return note;
  }

  async update(ownerId: string, id: string, dto: UpdateNoteDto) {
    const note = await this.findOne(ownerId, id);
    Object.assign(note, dto);
    return this.notes.save(note);
  }

  async remove(ownerId: string, id: string) {
    const note = await this.findOne(ownerId, id);
    await this.notes.remove(note);
    return { message: 'Nota eliminada correctamente' };
  }
}
