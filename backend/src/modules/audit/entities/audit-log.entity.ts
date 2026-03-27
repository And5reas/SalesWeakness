import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * AuditLog entity — append-only record of detected weaknesses.
 * PostgreSQL RLS policy allows INSERT only — no UPDATE or DELETE.
 */
@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'tenant_id' })
  tenantId!: number;

  @Column({ name: 'opportunity_id' })
  opportunityId!: number;

  /**
   * Weakness classification: Stagnation | Low_Conversion
   * Maps to audit_logs.weakness_type in the architecture spec.
   */
  @Column({ name: 'weakness_type', length: 50 })
  weaknessType!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  /** Immutable — set on creation, never updated */
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
