import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AccessGuard } from '../auth/guards/access.guard';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { NotesService } from './notes.service';

@UseGuards(AccessGuard)
@Controller('notes')
export class NotesController {
  constructor(private readonly notes: NotesService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateNoteDto) { return this.notes.create(req.user.id, dto); }

  @Get()
  findAll(@Req() req: any) { return this.notes.findAll(req.user.id); }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) { return this.notes.findOne(req.user.id, id); }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateNoteDto) { return this.notes.update(req.user.id, id, dto); }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) { return this.notes.remove(req.user.id, id); }
}
