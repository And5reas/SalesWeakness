import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Opportunity entity — represents a sales opportunity in the pipeline.
 * updated_at is monitored by the stagnation Worker every 15 minutes (48h threshold).
 */
@Entity('opportunities')
export class Opportunity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'tenant_id' })
  tenantId!: number;

  @Column({ name: 'lead_id' })
  leadId!: number;

  @Column({ name: 'stage_id' })
  stageId!: number;

  @Column({ name: 'assigned_user_id', nullable: true })
  assignedUserId!: number | null;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  value!: number | null;

  /**
   * Pipeline status: Open | Won | Lost
   * Drives RLS-filtered kanban views and stagnation detection.
   */
  @Column({ default: 'Open', length: 20 })
  status!: string;

  /**
   * Required when status = 'Lost' (RF04).
   * Feeds the loss analysis in the audit funnel report.
   */
  @Column({ name: 'lost_reason', length: 255, nullable: true })
  lostReason!: string | null;

  @Column({ name: 'expected_close_date', type: 'date', nullable: true })
  expectedCloseDate!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  /**
   * CRITICAL: Monitored by stagnation Worker to detect 48h inactivity.
   * Updated by TypeORM on every save — resets the 48h counter.
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
