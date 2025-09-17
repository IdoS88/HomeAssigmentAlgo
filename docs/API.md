# API Reference

## Core Classes

### Driver

Represents a driver with their availability, vehicle, and constraints.

```typescript
interface Driver {
  id: string;
  name: string;
  license: 'B' | 'D1' | 'D';
  vehicleSeats: number;
  fuelCost: number; // ₪/km
  location: {
    lat: number;
    lng: number;
  };
  shifts?: Array<{
    startMinutes: number;
    endMinutes: number;
  }>;
}
```

### Ride

Represents a ride request with pickup/dropoff locations and requirements.

```typescript
interface Ride {
  id: string;
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  pickup: {
    lat: number;
    lng: number;
  };
  dropoff: {
    lat: number;
    lng: number;
  };
  passengers: number;
}
```

### Assignment

Represents the result of assigning a driver to a ride.

```typescript
interface Assignment {
  ride: Ride;
  driver: Driver;
  totalCostAg: number; // Total cost in agorot
  loadedTimeMinutes: number;
  loadedDistanceKm: number;
  deadheadTimeMinutes: number;
  deadheadDistanceKm: number;
}
```

## Strategy Interface

### Strategy

Base interface for all assignment strategies.

```typescript
interface Strategy {
  assign(
    rides: Ride[],
    drivers: Driver[],
    options: AssignmentOptions
  ): Promise<Assignment[]>;
}
```

### AssignmentOptions

Configuration options for assignment algorithms.

```typescript
interface AssignmentOptions {
  includeDeadheadTime: boolean;
  includeDeadheadFuel: boolean;
  useOSRM: boolean;
}
```

## Assignment Strategies

### GreedyStrategy

Fast greedy assignment algorithm that makes locally optimal choices.

```typescript
class GreedyStrategy implements Strategy {
  constructor(travelEngine?: TravelEngine);
  
  async assign(
    rides: Ride[],
    drivers: Driver[],
    options: AssignmentOptions
  ): Promise<Assignment[]>;
}
```

**Algorithm**: O(n²) time complexity
- Sorts rides by start time
- For each ride, finds the best available driver
- Assigns immediately without backtracking

### MinCostFlowStrategy

Optimal assignment using minimum cost flow algorithms.

```typescript
class MinCostFlowStrategy implements Strategy {
  constructor(travelEngine?: TravelEngine);
  
  async assign(
    rides: Ride[],
    drivers: Driver[],
    options: AssignmentOptions
  ): Promise<Assignment[]>;
}
```

**Algorithm**: O(n³) time complexity
- Creates bipartite graph (drivers ↔ rides)
- Adds source and sink nodes
- Calculates optimal flow using network flow algorithms
- Extracts assignments from flow solution

## Utility Functions

### Data Parsing

```typescript
// Parse drivers from JSON
function parseDrivers(json: unknown): Driver[];

// Parse rides from JSON
function parseRides(json: unknown): Ride[];
```

### Availability Checking

```typescript
// Check if driver is available for a ride
function isDriverAvailableForRide(
  driver: Driver,
  rideStartTime: number,
  rideEndTime: number,
  deadheadTimeMinutes: number
): boolean;
```

### Time Utilities

```typescript
// Parse date and time to minutes since day start
function parseDateTime(date: string, time: string): number;

// Parse shift time to minutes since day start
function parseShiftTime(time: string): number;
```

### Cost Calculations

```typescript
// Convert agorot to shekels
function fromAgorot(agorot: number): number;

// Convert shekels to agorot
function toAgorot(shekels: number): number;
```

### Geographic Calculations

```typescript
// Calculate distance between two points (Haversine formula)
function calculateDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number; // Returns distance in kilometers

// Calculate travel time based on distance
function calculateTravelTime(distanceKm: number): number; // Returns time in minutes
```

## Travel Engine

### TravelEngine

Interface for routing and travel calculations.

```typescript
interface TravelEngine {
  calculateRoute(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number }
  ): Promise<{
    distance: number;
    duration: number;
  }>;
}
```

### SimpleTravelEngine

Basic travel engine using straight-line distance calculations.

```typescript
class SimpleTravelEngine implements TravelEngine {
  calculateRoute(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number }
  ): Promise<{
    distance: number;
    duration: number;
  }>;
}
```

### OSRMTravelEngine

Advanced travel engine using OSRM routing service.

```typescript
class OSRMTravelEngine implements TravelEngine {
  constructor(baseUrl?: string);
  
  calculateRoute(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number }
  ): Promise<{
    distance: number;
    duration: number;
  }>;
}
```

## Business Rules

### Legal Validation

```typescript
// Check if driver can legally transport passengers
function canDriverTransportPassengers(
  driver: Driver,
  passengers: number
): boolean;

// Check if driver has required license for vehicle
function hasRequiredLicense(
  driver: Driver,
  vehicleSeats: number
): boolean;
```

### Capacity Validation

```typescript
// Check if vehicle has sufficient capacity
function hasSufficientCapacity(
  driver: Driver,
  passengers: number
): boolean;
```

## Error Handling

### Validation Errors

The system uses Zod for input validation and throws structured errors:

```typescript
// ZodError for invalid input data
class ZodError extends Error {
  issues: Array<{
    path: string[];
    message: string;
    code: string;
  }>;
}
```

### Business Logic Errors

```typescript
// Custom error for business rule violations
class BusinessRuleError extends Error {
  constructor(
    message: string,
    public rule: string,
    public context?: any
  );
}
```

## Performance Considerations

### Memory Usage

- Strategies are designed to handle large datasets efficiently
- Geographic calculations are cached to avoid redundant computations
- Memory is properly cleaned up after assignment operations

### Time Complexity

- **Greedy Strategy**: O(n²) - suitable for real-time scenarios
- **Min-Cost Flow**: O(n³) - better for batch processing with optimal results

### Scalability

- Both strategies can handle datasets with thousands of drivers and rides
- Performance degrades gracefully with larger datasets
- Memory usage scales linearly with input size

## Examples

### Basic Usage

```typescript
import { GreedyStrategy, parseDrivers, parseRides } from './src';

// Parse data
const drivers = parseDrivers(driversJson);
const rides = parseRides(ridesJson);

// Create strategy
const strategy = new GreedyStrategy();

// Run assignment
const assignments = await strategy.assign(rides, drivers, {
  includeDeadheadTime: true,
  includeDeadheadFuel: true,
  useOSRM: false
});

console.log(`Assigned ${assignments.length} rides`);
```

### Advanced Usage with OSRM

```typescript
import { MinCostFlowStrategy, OSRMTravelEngine } from './src';

// Create OSRM travel engine
const travelEngine = new OSRMTravelEngine('http://localhost:5000');

// Create strategy with OSRM
const strategy = new MinCostFlowStrategy(travelEngine);

// Run assignment with OSRM routing
const assignments = await strategy.assign(rides, drivers, {
  includeDeadheadTime: true,
  includeDeadheadFuel: true,
  useOSRM: true
});
```

### Custom Validation

```typescript
import { isDriverAvailableForRide, parseDateTime } from './src';

// Check driver availability
const rideStartTime = parseDateTime('2025-03-10', '08:00');
const rideEndTime = parseDateTime('2025-03-10', '09:00');
const deadheadTime = 15; // minutes

const isAvailable = isDriverAvailableForRide(
  driver,
  rideStartTime,
  rideEndTime,
  deadheadTime
);

if (!isAvailable) {
  console.log('Driver not available for this ride');
}
```
