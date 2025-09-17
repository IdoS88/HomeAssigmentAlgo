#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path'; 
import { RawDriverSchema, RawRideSchema } from '../src/domain.js';

// Declare process for Node.js environment
declare const process: {
  argv: string[];
  cwd(): string;
  exit(code: number): never;
};

/**
 * Enhanced data generator CLI for creating drivers.json and rides.json from seed files
 * 
 * Features:
 * - Schema validation using Zod
 * - Flexible output options
 * - Better error handling
 * - Integration with domain types
 * - Data quality validation
 */

interface DriverSeed {
  name: string;
  city: string;
  seats: number;
  license: string;
  fuelCost: number;
}

interface RideSeed {
  date: string;
  startTime: string;
  endTime: string;
  startPoint: string;
  endPoint: string;
  passengers: number;
}

interface ParsedSeed {
  drivers: DriverSeed[];
  rides: RideSeed[];
}

interface GeneratorOptions {
  seedFile: string;
  outputDir: string;
  driversFile: string;
  ridesFile: string;
  validate: boolean;
  verbose: boolean;
}

// Predefined coordinates for known locations
const PREDEFINED_COORDS: Record<string, [number, number]> = {
  'Givat Bilu, Hadera': [32.4356, 34.9178],
  'Yoseftal, Hadera': [32.4356, 34.9178],
  'Shlomo, Hadera': [32.4356, 34.9178],
  'Brandeis, Hadera': [32.4356, 34.9178],
  'Bialik, Hadera': [32.4356, 34.9178],
  'Nahliel, Hadera': [32.4356, 34.9178],
  'Elram, Hadera': [32.4356, 34.9178],
  'Alon, Netanya': [32.3215, 34.8532],
  'Kinneret, Netanya': [32.3215, 34.8532],
  'Ben Gurion, Netanya': [32.3215, 34.8532],
  'Derekh HaBanim, Pardes Hanna': [32.4731, 34.9708],
  'Atzmaut, Pardes Hanna': [32.4731, 34.9708],
  'Bilu, Pardes Hanna': [32.4731, 34.9708],
  'Emek Hefer Industrial Park, Emek Hefer': [32.3833, 34.9167],
  'Neve Hayyim, Hadera': [32.4356, 34.9178]
};

class DataGenerator {
  private options: GeneratorOptions;

  constructor(options: GeneratorOptions) {
    this.options = options;
  }

  private log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    if (!this.options.verbose && level === 'info') return;
    
    const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} ${message}`);
  }

  private parseSeedFile(): ParsedSeed {
    this.log(`Reading seed file: ${this.options.seedFile}`);
    const content = fs.readFileSync(this.options.seedFile, 'utf-8');
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);

    const drivers: DriverSeed[] = [];
    const rides: RideSeed[] = [];
    let currentSection = '';

    for (const line of lines) {
      if (line.startsWith('## Drivers')) {
        currentSection = 'drivers';
        continue;
      } else if (line.startsWith('## Rides')) {
        currentSection = 'rides';
        continue;
      }

      if (currentSection === 'drivers' && line.startsWith('- **Name**:')) {
        const driver = this.parseDriverLine(line);
        if (driver) drivers.push(driver);
      } else if (currentSection === 'rides' && line.startsWith('- **Date**:')) {
        const ride = this.parseRideLine(line);
        if (ride) rides.push(ride);
      }
    }

    this.log(`Parsed ${drivers.length} drivers and ${rides.length} rides`);
    return { drivers, rides };
  }

  private parseDriverLine(line: string): DriverSeed | null {
    try {
      // Parse: - **Name**: John Doe, **City**: Shlomo, Hadera, **Seats**: 8, **License**: B, **Fuel Cost**: 2.5
      const nameMatch = line.match(/\*\*Name\*\*:\s*([^,]+)/);
      const cityMatch = line.match(/\*\*City\*\*:\s*([^,]+(?:,\s*[^,]+)*?)(?=,\s*\*\*Seats\*\*)/);
      const seatsMatch = line.match(/\*\*Seats\*\*:\s*(\d+)/);
      const licenseMatch = line.match(/\*\*License\*\*:\s*([^,]+)/);
      const fuelMatch = line.match(/\*\*Fuel Cost\*\*:\s*([\d.]+)/);

      if (!nameMatch || !cityMatch || !seatsMatch || !licenseMatch || !fuelMatch) {
        throw new Error('Missing required fields');
      }

      const license = licenseMatch[1]!.trim();
      if (!['B', 'D1', 'D'].includes(license)) {
        throw new Error(`Invalid license type: ${license}. Must be B, D1, or D`);
      }

      return {
        name: nameMatch[1]!.trim(),
        city: cityMatch[1]!.trim(),
        seats: parseInt(seatsMatch[1]!),
        license: license as 'B' | 'D1' | 'D',
        fuelCost: parseFloat(fuelMatch[1]!)
      };
    } catch (error) {
      this.log(`Error parsing driver line: ${line} - ${error}`, 'warn');
      return null;
    }
  }

  private parseRideLine(line: string): RideSeed | null {
    try {
      // Parse: - **Date**: 2025-03-10, **Start Time**: 06:45, **End Time**: 07:05, **Start Point**: Givat Bilu, Hadera, **End Point**: Yoseftal, Hadera, **Passengers**: 4
      const dateMatch = line.match(/\*\*Date\*\*:\s*([^,]+)/);
      const startTimeMatch = line.match(/\*\*Start Time\*\*:\s*([^,]+)/);
      const endTimeMatch = line.match(/\*\*End Time\*\*:\s*([^,]+)/);
      const startPointMatch = line.match(/\*\*Start Point\*\*:\s*([^,]+(?:,\s*[^,]+)*?)(?=,\s*\*\*End Point\*\*)/);
      const endPointMatch = line.match(/\*\*End Point\*\*:\s*([^,]+(?:,\s*[^,]+)*?)(?=,\s*\*\*Passengers\*\*)/);
      const passengersMatch = line.match(/\*\*Passengers\*\*:\s*(\d+)/);

      if (!dateMatch || !startTimeMatch || !endTimeMatch || !startPointMatch || !endPointMatch || !passengersMatch) {
        throw new Error('Missing required fields');
      }

      // Validate date format (YYYY-MM-DD)
      const date = dateMatch[1]!.trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new Error(`Invalid date format: ${date}. Expected YYYY-MM-DD`);
      }

      // Validate time format (HH:MM)
      const startTime = startTimeMatch[1]!.trim();
      const endTime = endTimeMatch[1]!.trim();
      if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
        throw new Error(`Invalid time format. Expected HH:MM`);
      }

      return {
        date,
        startTime,
        endTime,
        startPoint: startPointMatch[1]!.trim(),
        endPoint: endPointMatch[1]!.trim(),
        passengers: parseInt(passengersMatch[1]!)
      };
    } catch (error) {
      this.log(`Error parsing ride line: ${line} - ${error}`, 'warn');
      return null;
    }
  }

  private generateDriverId(index: number): string {
    return `DRV${String(index + 1).padStart(3, '0')}`;
  }

  private generateRideId(index: number): string {
    return `RIDE${String(index + 1).padStart(3, '0')}`;
  }

  private generatePhoneNumber(): string {
    return `050-${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`;
  }

  private generateShifts(index: number): Array<{ start: string; end: string }> {
    // Generate realistic shift patterns
    const shiftPatterns = [
      [{ start: "06:00", end: "14:00" }], // Early shift
      [{ start: "14:00", end: "22:00" }], // Late shift
      [{ start: "08:00", end: "16:00" }], // Day shift
      [{ start: "06:00", end: "10:00" }, { start: "14:00", end: "18:00" }], // Split shift
      [{ start: "07:00", end: "15:00" }], // Standard shift
    ];
    
    return shiftPatterns[index % shiftPatterns.length]!;
  }

  private validateData(drivers: unknown[], rides: unknown[]): void {
    if (!this.options.validate) return;

    this.log('Validating generated data against schemas...');
    
    try {
      // Validate drivers
      for (let i = 0; i < drivers.length; i++) {
        RawDriverSchema.parse(drivers[i]);
      }
      this.log(`✅ All ${drivers.length} drivers passed validation`);

      // Validate rides
      for (let i = 0; i < rides.length; i++) {
        RawRideSchema.parse(rides[i]);
      }
      this.log(`✅ All ${rides.length} rides passed validation`);
    } catch (error) {
      this.log(`Schema validation failed: ${error}`, 'error');
      throw new Error(`Data validation failed: ${error}`);
    }
  }

  private ensureOutputDirectory(): void {
    if (!fs.existsSync(this.options.outputDir)) {
      this.log(`Creating output directory: ${this.options.outputDir}`);
      fs.mkdirSync(this.options.outputDir, { recursive: true });
    }
  }

  async generate(): Promise<void> {
    this.log('🚀 Starting data generation...');
    
    try {
      const seed = this.parseSeedFile();
      
      if (seed.drivers.length === 0) {
        throw new Error('No drivers found in seed file');
      }
      
      if (seed.rides.length === 0) {
        throw new Error('No rides found in seed file');
      }

      this.ensureOutputDirectory();

      // Generate drivers.json
      this.log('Generating drivers.json...');
      const drivers = seed.drivers.map((driver, index) => {
        const coords = PREDEFINED_COORDS[driver.city];
        if (!coords) {
          throw new Error(`No coordinates found for driver city: ${driver.city}`);
        }

        return {
          driverId: this.generateDriverId(index),
          firstName: driver.name.split(' ')[0],
          lastName: driver.name.split(' ').slice(1).join(' ') || 'Unknown',
          city: driver.city,
          mainPhone: this.generatePhoneNumber(),
          status: 'active',
          licenceDegree: [driver.license],
          numberOfSeats: driver.seats,
          fuelCost: driver.fuelCost,
          city_coords: coords,
          shifts: this.generateShifts(index), // Add shifts
        };
      });

      // Generate rides.json
      this.log('Generating rides.json...');
      const rides = seed.rides.map((ride, index) => {
        const startCoords = PREDEFINED_COORDS[ride.startPoint];
        const endCoords = PREDEFINED_COORDS[ride.endPoint];
        
        if (!startCoords || !endCoords) {
          throw new Error(`No coordinates found for ride: ${ride.startPoint} -> ${ride.endPoint}`);
        }

        return {
          _id: this.generateRideId(index),
          date: ride.date,
          startTime: ride.startTime,
          endTime: ride.endTime,
          startPoint: ride.startPoint,
          endPoint: ride.endPoint,
          numberOfSeats: ride.passengers,
          startPoint_coords: startCoords,
          endPoint_coords: endCoords,
        };
      });

      // Validate data if requested
      this.validateData(drivers, rides);

      // Write output files
      const driversPath = path.join(this.options.outputDir, this.options.driversFile);
      const ridesPath = path.join(this.options.outputDir, this.options.ridesFile);
      
      fs.writeFileSync(driversPath, JSON.stringify(drivers, null, 2));
      fs.writeFileSync(ridesPath, JSON.stringify(rides, null, 2));

      this.log('✅ Data generation complete!');
      this.log(`Generated files:`);
      this.log(`   - ${driversPath} (${drivers.length} drivers)`);
      this.log(`   - ${ridesPath} (${rides.length} rides)`);
      
    } catch (error) {
      this.log(`Data generation failed: ${error}`, 'error');
      throw error;
    }
  }
}

// CLI interface
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  const options: GeneratorOptions = {
    seedFile: 'tools/seed.md',
    outputDir: process.cwd(),
    driversFile: 'drivers.json',
    ridesFile: 'rides.json',
    validate: false,
    verbose: false,
  };

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--seed':
        options.seedFile = args[i + 1]!;
        i++;
        break;
      case '--output-dir':
        options.outputDir = args[i + 1]!;
        i++;
        break;
      case '--drivers-file':
        options.driversFile = args[i + 1]!;
        i++;
        break;
      case '--rides-file':
        options.ridesFile = args[i + 1]!;
        i++;
        break;
      case '--validate':
        options.validate = true;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--help':
      case '-h':
        console.log(`
🚀 Enhanced Data Generator CLI

Usage:
  tsx tools/generate-data.ts [options]

Options:
  --seed <file>         Seed file path (default: tools/seed.md)
  --output-dir <dir>    Output directory (default: current directory)
  --drivers-file <file> Drivers output filename (default: drivers.json)
  --rides-file <file>   Rides output filename (default: rides.json)
  --validate            Validate generated data against schemas
  --verbose, -v         Enable verbose logging
  --help, -h            Show this help message

Examples:
  # Basic usage
  tsx tools/generate-data.ts

  # With custom seed file
  tsx tools/generate-data.ts --seed tools/seed.example.md

  # With validation and custom output
  tsx tools/generate-data.ts --validate --output-dir data --verbose

  # Generate to specific files
  tsx tools/generate-data.ts --drivers-file my-drivers.json --rides-file my-rides.json

Features:
  ✅ Schema validation using Zod
  ✅ Flexible output options
  ✅ Better error handling
  ✅ Data quality validation
  ✅ Verbose logging
        `);
        process.exit(0);
      default:
        console.error(`Unknown option: ${args[i]}`);
        console.error('Use --help for usage information');
        process.exit(1);
    }
  }

  // Validate seed file exists
  if (!fs.existsSync(options.seedFile)) {
    console.error(`❌ Seed file not found: ${options.seedFile}`);
    console.error(`Create a seed file or use the example: tools/seed.example.md`);
    process.exit(1);
  }

  try {
    const generator = new DataGenerator(options);
    await generator.generate();
  } catch (error) {
    console.error('❌ Data generation failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url.endsWith('generate-data.ts') || import.meta.url.includes('generate-data')) {
  main();
}