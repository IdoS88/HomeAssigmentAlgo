# Ride Assignment Algorithm

A sophisticated ride assignment system that optimally matches drivers with rides using multiple algorithmic strategies, including greedy and minimum cost flow approaches.

## 🎯 Quick Demo

Want to see it in action? Just run:

```bash
npm install
npm start
```

The project will build and run with sample data, demonstrating the ride assignment algorithm with real results!

## 🚀 Features

- **Multiple Assignment Strategies**: Greedy and Minimum Cost Flow algorithms
- **Driver Shift Management**: Respects driver availability windows
- **Cost Optimization**: Considers fuel costs, deadhead time, and distance
- **Geographic Routing**: Supports both simple distance calculations and OSRM routing
- **Comprehensive Testing**: Unit, integration, and performance tests
- **CLI Interface**: Easy-to-use command-line tool
- **TypeScript**: Full type safety and modern development experience

## 📋 Requirements

- Node.js >= 22.0.0
- TypeScript >= 5.3.3

## 🛠️ Installation

```bash
# Clone the repository
git clone <repository-url>
cd HomeAssigmentAlgo

# Install dependencies
npm install

# Build the project
npm run build
```

## 🚀 Quick Start

### One-Command Demo

```bash
# Install dependencies and run with sample data
npm install
npm start
```

That's it! The project will build and run with sample data, showing you the ride assignment algorithm in action.

### Alternative Commands

```bash
# Run with greedy strategy (default)
npm run start:greedy

# Run with minimum cost flow strategy
npm run start:mincost

# Run with deadhead costs included
npm run start:with-deadhead

# Development mode with custom data
npm run dev -- --drivers data/sample-drivers.json --rides data/sample-rides.json
```

### Available Strategies

1. **Greedy Strategy** (`--strategy greedy`)
   - Fast assignment using local optimization
   - Good for real-time scenarios
   - Default strategy

2. **Minimum Cost Flow** (`--strategy mincost`)
   - Global optimization using network flow algorithms
   - Better cost optimization for complex scenarios
   - Slower but more optimal results

## 📁 Project Structure

```
HomeAssigmentAlgo/
├── src/                    # Source code
│   ├── cli.ts             # Command-line interface
│   ├── domain.ts          # Core domain models and validation
│   ├── cost.ts            # Cost calculation utilities
│   ├── geo.ts             # Geographic calculations
│   ├── legal.ts           # Business rule validation
│   ├── osrm.ts            # OSRM routing integration
│   ├── strategy.ts        # Strategy interface
│   ├── strategies/        # Assignment strategies
│   │   ├── greedy.ts      # Greedy assignment algorithm
│   │   └── minCostFlow.ts # Minimum cost flow algorithm
│   └── test-helpers.ts    # Test utilities
├── tests/                 # Test files
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   └── performance/       # Performance tests
├── data/                  # Sample data files
├── docs/                  # Documentation
├── tools/                 # Development tools
└── dist/                  # Compiled JavaScript (generated)
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:performance   # Performance tests only

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📊 Data Format

### Drivers JSON Format

```json
[
  {
    "driverId": "driver1",
    "firstName": "John",
    "lastName": "Doe",
    "city": "Tel Aviv",
    "mainPhone": "+972-50-1234567",
    "status": "active",
    "licenceDegree": ["B", "D1"],
    "numberOfSeats": 8,
    "fuelCost": 2.5,
    "city_coords": [32.0853, 34.7818],
    "shifts": [
      {
        "start": "06:00",
        "end": "14:00"
      }
    ]
  }
]
```

### Rides JSON Format

```json
[
  {
    "_id": "ride1",
    "date": "2025-03-10",
    "startTime": "08:00",
    "endTime": "09:00",
    "startPoint": "Tel Aviv",
    "endPoint": "Jerusalem",
    "numberOfSeats": 4,
    "startPoint_coords": [32.0853, 34.7818],
    "endPoint_coords": [31.7683, 35.2137]
  }
]
```

## 🔧 Configuration Options

### CLI Options

- `--drivers <file>`: Path to drivers JSON file (required)
- `--rides <file>`: Path to rides JSON file (required)
- `--strategy <strategy>`: Assignment strategy (`greedy` or `mincost`)
- `--includeDeadheadTime`: Include deadhead time in cost calculation
- `--includeDeadheadFuel`: Include deadhead fuel cost in calculation
- `--out <file>`: Output file path (default: stdout)
- `--osrm`: Use OSRM for routing (experimental)
- `--help`: Show help message

### Assignment Options

- `includeDeadheadTime`: Whether to include travel time to pickup location
- `includeDeadheadFuel`: Whether to include fuel cost for deadhead travel
- `useOSRM`: Whether to use OSRM routing service (requires internet connection)

## 🏗️ Development

### Building

```bash
# Build TypeScript to JavaScript
npm run build

# Development mode with auto-reload
npm run dev
```

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format
```

### Data Generation

```bash
# Generate test data
npm run gen:data

# Generate data with OSRM validation
npm run gen:data:osrm
```

## 📈 Performance

The system is optimized for performance with:

- **Efficient Algorithms**: O(n²) greedy and O(n³) min-cost flow
- **Memory Management**: Proper cleanup and garbage collection
- **Caching**: Geographic calculations are cached
- **Batch Processing**: Handles large datasets efficiently

### Performance Testing

```bash
# Run performance tests
npm run test:performance

# Memory leak testing
node simple-memory-test.js
```

## 🔍 Algorithm Details

### Greedy Strategy

1. Sort rides by start time
2. For each ride, find the best available driver
3. Assign immediately (no backtracking)
4. Time Complexity: O(n²)
5. Space Complexity: O(n)

### Minimum Cost Flow Strategy

1. Create a bipartite graph (drivers ↔ rides)
2. Add source and sink nodes
3. Calculate optimal flow using network flow algorithms
4. Extract assignments from flow solution
5. Time Complexity: O(n³)
6. Space Complexity: O(n²)

## 🚨 Error Handling

The system includes comprehensive error handling:

- **Input Validation**: Zod schema validation for all inputs
- **Business Rules**: Driver availability, license requirements, capacity checks
- **Geographic Validation**: Coordinate bounds checking
- **Performance Monitoring**: Timeout and memory limit protection

## 📚 API Reference

### Core Classes

- `GreedyStrategy`: Fast greedy assignment algorithm
- `MinCostFlowStrategy`: Optimal assignment using network flow
- `Driver`: Driver entity with availability and constraints
- `Ride`: Ride entity with pickup/dropoff and requirements

### Key Functions

- `parseDrivers(json)`: Parse and validate driver data
- `parseRides(json)`: Parse and validate ride data
- `isDriverAvailableForRide()`: Check driver availability
- `calculateDistance()`: Geographic distance calculation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

### Development Guidelines

- Follow TypeScript best practices
- Write comprehensive tests
- Document public APIs
- Maintain performance benchmarks
- Follow the existing code style

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For questions, issues, or contributions:

1. Check the documentation in `/docs`
2. Review existing issues
3. Create a new issue with detailed information
4. Include test data and expected behavior

## 🔄 Version History

- **v1.0.0**: Initial release with greedy and min-cost flow strategies
- Basic CLI interface
- Comprehensive test suite
- Performance optimization