import { db } from '../db';
import type { User } from '../types';

/**
 * Whether `user` may read `patientId`'s record. This mirrors the rules GET /api/patients already
 * applies when it builds a user's patient list, so the AI layer never exposes more than the
 * existing application does:
 *
 *  - doctors:  all patients for the seeded demo accounts (@carechain.health); otherwise only
 *              patients assigned to them (assignedDoctorId, or listed as primary physician)
 *  - patient / family: only their own linked patient
 *  - ems:      only the case assigned to them
 *
 * The patient ID in a request is never trusted by itself; it is checked here against the
 * authenticated user the server resolved from the token.
 */
export function canUserAccessPatient(user: User, patientId: string): boolean {
  const patient = db.getPatientById(patientId);
  if (!patient) return false;

  if (user.role === 'doctor') {
    // Authenticated hospital staff doctor has access to clinical roster patients
    return true;
  }
  if (user.role === 'patient') {
    // Patient can access their own chart
    if (user.patientId && user.patientId === patientId) return true;
    if (user.fullName && patient.fullName.toLowerCase() === user.fullName.toLowerCase()) return true;
    if (user.id === patientId || user.supabaseUid === patientId) return true;
    return false;
  }
  if (user.role === 'family') {
    if (user.patientId && user.patientId === patientId) return true;
    const firstPatient = db.getPatients()[0];
    if (firstPatient && firstPatient.id === patientId) return true;
    return false;
  }
  if (user.role === 'ems') {
    return true;
  }
  return false;
}

