# Security Specification for Firestore Rules

## 1. Data Invariants
- **Tickets (`/tickets/{ticketId}`)**:
  - Must have a valid `tipo` ('recepcion' or 'despacho').
  - Must have a non-empty `numeroGuia` and `patenteCamion`.
  - Document ID must be a valid alphanumeric string.
- **Patentes (`/patentes/{patenteId}`)**:
  - Must have `patenteCamion`, `siglaCamion`, and `transportista`.
- **Conductores (`/conductores/{conductorId}`)**:
  - Must have `rutConductor`, `nombreConductor`, and `transportista`.
- **Productos (`/productos/{productoId}`)**:
  - Must have `codigoProducto`, `especie`, and `largo`.
- **Users (`/users/{userId}`)**:
  - Must have `id`, `nombre`, `rol` ('admin' | 'usuario').

## 2. Dirty Dozen Payloads (Rejection Targets)
1. Injection of oversize IDs (Denial of Wallet).
2. Ghost fields on ticket creation (e.g. `isHacked: true`).
3. Invalid ticket type (e.g. `tipo: 'invalido'`).
4. Missing required `numeroGuia`.
5. Missing required `patenteCamion`.
6. Negative or arbitrary length exceeding constraints.
7. Unchecked role escalations on users without validation.
8. Writing tickets with empty strings for primary IDs.
9. Modifying immutable system fields.
10. Unauthenticated write attempt on restricted records.
11. Corrupted format in conductor RUT field.
12. Blank string product code.

## 3. Rules Implementation
- Enforces strict type guards (`is string`, string length boundaries).
- Enforces validation helpers per entity (`isValidTicket`, `isValidPatente`, `isValidConductor`, `isValidProducto`, `isValidUser`).
- Default deny fallback.
