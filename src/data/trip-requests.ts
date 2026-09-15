/**
 * Local dummy Trip Requests for the frontend-first phase. Realistic FleetTrack (Kerala
 * fleet) data across PENDING / APPROVED / REJECTED. This is the ONLY data source the
 * dummy service reads — it makes NO backend calls. When Backend Slice 2 is ready, the
 * service internals swap to the real API and this file is dropped.
 */

import {
  TripRequest,
  TripRequestStatus,
  TripRequestReviewer,
} from "@/types/trip-request";
import type { TripClient, TripVehicle, TripCustomer } from "@/types/trip";

const CL_MALABAR: TripClient = { id: "cl-malabar", name: "Malabar Logistics" };
const CL_COCHIN: TripClient = { id: "cl-cochin", name: "Cochin Freight Carriers" };
const CL_KERALA: TripClient = { id: "cl-kerala", name: "Kerala Cargo Movers" };

/**
 * The demo "current client". In the dummy phase the CLIENT view shows this client's
 * requests (a real logged-in client id won't match seed rows), and client-created
 * requests are attached here so they appear in that view.
 */
export const CURRENT_DUMMY_CLIENT: TripClient = CL_MALABAR;

/** The demo reviewer stamped on approve/reject actions. */
export const DUMMY_REVIEWER: TripRequestReviewer = {
  id: "admin-fleet",
  name: "Fleet Admin",
};

const V = {
  ace: { id: "veh-ace", vehicleNumber: "KL07CD4521", vehicleName: "Tata Ace" },
  dost: {
    id: "veh-dost",
    vehicleNumber: "KL84B5054",
    vehicleName: "Ashok Leyland Dost",
  },
  eicher: {
    id: "veh-eicher",
    vehicleNumber: "KL13AA9032",
    vehicleName: "Eicher Pro 2049",
  },
  bolero: {
    id: "veh-bolero",
    vehicleNumber: "KL84C7577",
    vehicleName: "Mahindra Bolero Pickup",
  },
  tata407: {
    id: "veh-407",
    vehicleNumber: "KL11BU0749",
    vehicleName: "Tata 407",
  },
} satisfies Record<string, TripVehicle>;

const C = {
  nedumbassery: { id: "cus-ned", name: "Nedumbassery Traders" },
  retail: { id: "cus-retail", name: "Kochi Retail Hub" },
  guruvayur: { id: "cus-guru", name: "Guruvayur Provisions" },
  spices: { id: "cus-spice", name: "Malabar Spices Co." },
} satisfies Record<string, TripCustomer>;

interface SeedInput {
  id: string;
  status: TripRequestStatus;
  client: TripClient;
  reference: string;
  vehicle: TripVehicle;
  driverName: string;
  customer?: TripCustomer | null;
  origin: string;
  destination: string;
  stops?: string[];
  distanceKm: number;
  durationMins: number;
  notes?: string | null;
  scheduledStart: string;
  scheduledEnd: string;
  createdAt: string;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  tripReference?: string | null;
}

/** Fill the repetitive/derived fields so each seed row reads as just its real data. */
function mk(s: SeedInput): TripRequest {
  const reviewed = s.status !== TripRequestStatus.PENDING;
  const approved = s.status === TripRequestStatus.APPROVED;
  return {
    id: s.id,
    status: s.status,
    clientId: s.client.id,
    client: s.client,
    reference: s.reference,
    vehicleId: s.vehicle.id,
    vehicle: s.vehicle,
    driverId: `drv:${s.driverName.toLowerCase().replace(/\s+/g, "-")}`,
    driverName: s.driverName,
    // Driver phone is only ever set by an ADMIN at approval; seed rows carry none.
    driverPhone: null,
    customerId: s.customer ? s.customer.id : null,
    customer: s.customer ?? null,
    origin: s.origin,
    destination: s.destination,
    originLat: null,
    originLng: null,
    destinationLat: null,
    destinationLng: null,
    stops: (s.stops ?? []).map((address) => ({ address })),
    distanceKm: s.distanceKm,
    durationMins: s.durationMins,
    notes: s.notes ?? null,
    scheduledStart: s.scheduledStart,
    scheduledEnd: s.scheduledEnd,
    tripId: approved ? `trip-${s.id}` : null,
    trip: approved
      ? { id: `trip-${s.id}`, reference: s.tripReference ?? s.reference }
      : null,
    reviewedById: reviewed ? DUMMY_REVIEWER.id : null,
    reviewedBy: reviewed ? DUMMY_REVIEWER : null,
    reviewedAt: reviewed ? (s.reviewedAt ?? null) : null,
    rejectionReason:
      s.status === TripRequestStatus.REJECTED
        ? (s.rejectionReason ?? null)
        : null,
    createdAt: s.createdAt,
    updatedAt: reviewed ? (s.reviewedAt ?? s.createdAt) : s.createdAt,
  };
}

export const tripRequestSeed: TripRequest[] = [
  mk({
    id: "req-1009",
    status: TripRequestStatus.PENDING,
    client: CL_MALABAR,
    reference: "TRIP-2026-4A7C",
    vehicle: V.ace,
    driverName: "Rajesh Kumar",
    customer: C.nedumbassery,
    origin: "Kochi, Ernakulam",
    destination: "Kozhikode",
    stops: ["Thrissur Bypass", "Malappuram"],
    distanceKm: 182,
    durationMins: 240,
    notes: "Handle with care — glassware consignment.",
    scheduledStart: "2026-08-14T07:00:00.000Z",
    scheduledEnd: "2026-08-14T11:30:00.000Z",
    createdAt: "2026-08-12T05:20:00.000Z",
  }),
  mk({
    id: "req-1008",
    status: TripRequestStatus.PENDING,
    client: CL_MALABAR,
    reference: "TRIP-2026-51BD",
    vehicle: V.dost,
    driverName: "Vinod Nair",
    origin: "Kochi, Ernakulam",
    destination: "Kollam",
    distanceKm: 145,
    durationMins: 200,
    scheduledStart: "2026-08-16T06:30:00.000Z",
    scheduledEnd: "2026-08-16T10:00:00.000Z",
    createdAt: "2026-08-12T04:05:00.000Z",
  }),
  mk({
    id: "req-1007",
    status: TripRequestStatus.PENDING,
    client: CL_COCHIN,
    reference: "TRIP-2026-6E2A",
    vehicle: V.eicher,
    driverName: "Anil Thomas",
    origin: "Ernakulam",
    destination: "Thrissur",
    distanceKm: 78,
    durationMins: 110,
    notes: "Cold-chain load — keep reefer running.",
    scheduledStart: "2026-08-13T09:00:00.000Z",
    scheduledEnd: "2026-08-13T11:00:00.000Z",
    createdAt: "2026-08-11T15:40:00.000Z",
  }),
  mk({
    id: "req-1006",
    status: TripRequestStatus.PENDING,
    client: CL_KERALA,
    reference: "TRIP-2026-70F5",
    vehicle: V.tata407,
    driverName: "Suresh Menon",
    customer: C.retail,
    origin: "Kollam",
    destination: "Alappuzha",
    stops: ["Kayamkulam"],
    distanceKm: 86,
    durationMins: 130,
    scheduledStart: "2026-08-15T05:00:00.000Z",
    scheduledEnd: "2026-08-15T07:30:00.000Z",
    createdAt: "2026-08-11T10:15:00.000Z",
  }),
  mk({
    id: "req-1005",
    status: TripRequestStatus.APPROVED,
    client: CL_MALABAR,
    reference: "TRIP-2026-33C1",
    vehicle: V.dost,
    driverName: "Vinod Nair",
    customer: C.spices,
    origin: "Kochi, Ernakulam",
    destination: "Thiruvananthapuram",
    stops: ["Alappuzha", "Kollam"],
    distanceKm: 220,
    durationMins: 300,
    notes: "Priority delivery for the spice export order.",
    scheduledStart: "2026-08-13T04:00:00.000Z",
    scheduledEnd: "2026-08-13T09:00:00.000Z",
    createdAt: "2026-08-10T12:30:00.000Z",
    reviewedAt: "2026-08-11T08:10:00.000Z",
  }),
  mk({
    id: "req-1004",
    status: TripRequestStatus.APPROVED,
    client: CL_COCHIN,
    reference: "TRIP-2026-2B9E",
    vehicle: V.bolero,
    driverName: "Faisal Rahman",
    origin: "Kozhikode",
    destination: "Kannur",
    distanceKm: 92,
    durationMins: 140,
    scheduledStart: "2026-08-12T06:00:00.000Z",
    scheduledEnd: "2026-08-12T08:30:00.000Z",
    createdAt: "2026-08-09T09:45:00.000Z",
    reviewedAt: "2026-08-10T07:20:00.000Z",
  }),
  mk({
    id: "req-1003",
    status: TripRequestStatus.APPROVED,
    client: CL_MALABAR,
    reference: "TRIP-2026-18D4",
    vehicle: V.tata407,
    driverName: "Suresh Menon",
    customer: C.guruvayur,
    origin: "Ernakulam",
    destination: "Guruvayur",
    stops: ["Chalakudy"],
    distanceKm: 96,
    durationMins: 150,
    scheduledStart: "2026-08-10T05:30:00.000Z",
    scheduledEnd: "2026-08-10T08:00:00.000Z",
    createdAt: "2026-08-08T11:00:00.000Z",
    reviewedAt: "2026-08-08T16:05:00.000Z",
  }),
  mk({
    id: "req-1002",
    status: TripRequestStatus.REJECTED,
    client: CL_MALABAR,
    reference: "TRIP-2026-0AF7",
    vehicle: V.ace,
    driverName: "Rajesh Kumar",
    origin: "Kochi, Ernakulam",
    destination: "Munnar",
    stops: ["Adimali"],
    distanceKm: 130,
    durationMins: 210,
    notes: "Hill route — requested for early morning.",
    scheduledStart: "2026-08-11T02:30:00.000Z",
    scheduledEnd: "2026-08-11T06:00:00.000Z",
    createdAt: "2026-08-09T18:20:00.000Z",
    reviewedAt: "2026-08-10T09:30:00.000Z",
    rejectionReason:
      "Vehicle KL07CD4521 is already booked for an overlapping schedule that morning. Please pick another vehicle or time.",
  }),
  mk({
    id: "req-1001",
    status: TripRequestStatus.REJECTED,
    client: CL_KERALA,
    reference: "TRIP-2026-59B0",
    vehicle: V.eicher,
    driverName: "Joseph Mathew",
    origin: "Thrissur",
    destination: "Palakkad",
    distanceKm: 79,
    durationMins: 120,
    scheduledStart: "2026-08-09T07:00:00.000Z",
    scheduledEnd: "2026-08-09T09:00:00.000Z",
    createdAt: "2026-08-07T13:10:00.000Z",
    reviewedAt: "2026-08-08T10:00:00.000Z",
    rejectionReason:
      "Requested driver is on approved leave for the scheduled window.",
  }),
];
