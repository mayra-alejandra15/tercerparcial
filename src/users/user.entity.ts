import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Note } from '../notes/note.entity';
import { RefreshSession } from '../sessions/refresh-session.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Note, (note) => note.owner)
  notes: Note[];

  @OneToMany(() => RefreshSession, (session) => session.user)
  sessions: RefreshSession[];
}
