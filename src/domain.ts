import { z } from 'zod';

// Shift type for driver availability
export type Shift = { start: string; end: string }; // "HH:mm" format

// Raw driver schema from JSON
export const RawDriverSchema = z.object({
  driverId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  city: z.string(),
  mainPhone: z.string(),
  status: z.string(),
  licenceDegree: z.array(z.enum(['B', 'D1', 'D'])),
  numberOfSeats: z.number().int().positive(),
  fuelCost: z.number().positive(), // ₪/km
  city_coords: z.tuple([z.number(), z.number()]),
  shifts: z.array(z.object({
    start: z.string(), // "HH:mm" format
    end: z.string(),   // "HH:mm" format
  })).optional(),
});

// Raw ride schema from JSON
export const RawRideSchema = z.object({
  _id: z.string(),
  date: z.string(), // YYYY-MM-DD format
  startTime: z.string(), // HH:MM format
  endTime: z.string(), // HH:MM format
  startPoint: z.string(),
  endPoint: z.string(),
  numberOfSeats: z.number().int().positive(),
  startPoint_coords: z.tuple([z.number(), z.number()]),
  endPoint_coords: z.tuple([z.number(), z.number()]),
});

// Processed driver schema for internal use
export const DriverSchema = z.object({
  id: z.string(),
  name: z.string(),
  license: z.enum(['B', 'D1', 'D']),
  vehicleSeats: z.number().int().positive(),
  fuelCost: z.number().positive(), // ₪/km
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  shifts: z.array(z.object({
    startMinutes: z.number(), // minutes since day start
    endMinutes: z.number(),   // minutes since day start
  })).optional(),
});

// Processed ride schema for internal use
export const RideSchema = z.object({
  id: z.string(),
  date: z.string(), // YYYY-MM-DD format
  startTime: z.string(), // HH:MM format
  endTime: z.string(), // HH:MM format
  pickup: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  dropoff: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  passengers: z.number().int().positive(),
});

export type Driver = z.infer<typeof DriverSchema>;
export type Ride = z.infer<typeof RideSchema>;

// Parse date and time to minutes since day start
export function parseDateTime(date: string, time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

// Parse shift time to minutes since day start
export function parseShiftTime(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

// Check if driver is available for a ride considering shifts and deadhead time
export function isDriverAvailableForRide(
  driver: Driver,
  rideStartTime: number,
  rideEndTime: number,
  deadheadTimeMinutes: number
): boolean {
  // If no shifts defined, driver is always available (backward compatibility)
  if (!driver.shifts || driver.shifts.length === 0) {
    return true;
  }

  // Check if the entire ride (including deadhead) fits within any shift
  return driver.shifts.some(shift => {
    const shiftStart = shift.startMinutes;
    const shiftEnd = shift.endMinutes;
    
    // Ride must start after shift starts (accounting for deadhead)
    const earliestRideStart = shiftStart + deadheadTimeMinutes;
    if (rideStartTime < earliestRideStart) {
      return false;
    }
    
    // Ride must end before shift ends
    if (rideEndTime > shiftEnd) {
      return false;
    }
    
    return true;
  });
}

// Parse drivers from JSON
export function parseDrivers(json: unknown): Driver[] {
  const rawDrivers = z.array(RawDriverSchema).parse(json);
  return rawDrivers.map(raw => ({
    id: raw.driverId,
    name: `${raw.firstName} ${raw.lastName}`,
    license: raw.licenceDegree[0] as 'B' | 'D1' | 'D', // Use first license
    vehicleSeats: raw.numberOfSeats,
    fuelCost: raw.fuelCost,
    location: {
      lat: raw.city_coords[0],
      lng: raw.city_coords[1],
    },
    shifts: raw.shifts?.map(shift => ({
      startMinutes: parseShiftTime(shift.start),
      endMinutes: parseShiftTime(shift.end),
    })),
  }));
}

// Parse rides from JSON
export function parseRides(json: unknown): Ride[] {
  const rawRides = z.array(RawRideSchema).parse(json);
  return rawRides.map(raw => ({
    id: raw._id,
    date: raw.date,
    startTime: raw.startTime,
    endTime: raw.endTime,
    pickup: {
      lat: raw.startPoint_coords[0],
      lng: raw.startPoint_coords[1],
    },
    dropoff: {
      lat: raw.endPoint_coords[0],
      lng: raw.endPoint_coords[1],
    },
    passengers: raw.numberOfSeats,
  }));
}