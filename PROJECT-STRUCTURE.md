# Project Structure

This document outlines the organized structure of the Ride Assignment Algorithm project.

## 📁 Directory Structure

```
HomeAssigmentAlgo/
├── 📁 src/                          # Source code
│   ├── 📁 domain/                   # Domain layer (business logic)
│   │   ├── 📄 entities.ts           # Core domain entities (Driver, Ride, Assignment)
│   │   ├── 📄 value-objects.ts      # Value objects (coordinates, time, etc.)
│   │   ├── 📄 repositories.ts       # Repository interfaces
│   │   └── 📄 services.ts           # Domain services
│   ├── 📁 app/                      # Application layer (use cases)
│   │   ├── 📄 assignment-service.ts # Ride assignment use cases
│   │   ├── 📄 cost-calculator.ts    # Cost calculation logic
│   │   └── 📄 validation.ts         # Business rule validation
│   ├── 📁 infra/                    # Infrastructure layer
│   │   ├── 📄 geo.ts                # Geographic calculations
│   │   ├── 📄 osrm.ts               # OSRM routing integration
│   │   └── 📄 data-parser.ts        # Data parsing and validation
│   ├── 📁 http/                     # HTTP/CLI layer
│   │   ├── 📄 cli.ts                # Command-line interface
│   │   ├── 📄 routes.ts             # HTTP routes (if applicable)
│   │   └── 📄 middleware.ts         # HTTP middleware
│   ├── 📁 strategies/               # Assignment strategies
│   │   ├── 📄 greedy.ts             # Greedy assignment algorithm
│   │   ├── 📄 minCostFlow.ts        # Minimum cost flow algorithm
│   │   └── 📄 strategy.ts           # Strategy interface
│   └── 📄 test-helpers.ts           # Test utilities
│
├── 📁 tests/                        # Test files
│   ├── 📁 unit/                     # Unit tests
│   │   ├── 📄 debug.test.ts
│   │   ├── 📄 greedy.test.ts
│   │   ├── 📄 minCostFlow.test.ts
│   │   ├── 📄 minimal.test.ts
│   │   ├── 📄 quick.test.ts
│   │   └── 📄 shift-availability.test.ts
│   ├── 📁 integration/              # Integration tests
│   │   ├── 📄 comparison.test.ts
│   │   └── 📄 integration.test.ts
│   └── 📁 performance/              # Performance tests
│       └── 📄 placeholder.test.ts   # Placeholder test
│
├── 📁 data/                         # Sample data files
│   ├── 📄 drivers.json              # Original drivers data
│   ├── 📄 rides.json                # Original rides data
│   ├── 📄 enhanced-drivers.json     # Enhanced drivers data
│   ├── 📄 enhanced-rides.json       # Enhanced rides data
│   ├── 📄 sample-drivers.json       # Sample drivers data
│   └── 📄 sample-rides.json         # Sample rides data
│
├── 📁 docs/                         # Documentation
│   ├── 📄 README.md                 # Documentation index
│   ├── 📄 API.md                    # API reference
│   └── 📄 QA-BEST-PRACTICES.md      # Testing standards
│
├── 📁 tools/                        # Development tools
│   ├── 📄 generate-data.ts          # Data generation utility
│   ├── 📄 seed.example.md           # Example seed file
│   └── 📄 seed.md                   # Seed configuration
│
├── 📁 dist/                         # Compiled JavaScript (generated)
│   ├── 📄 cli.js                    # Compiled CLI
│   ├── 📄 *.js                      # Other compiled files
│   └── 📄 *.d.ts                    # TypeScript declarations
│
├── 📄 package.json                  # Project configuration
├── 📄 tsconfig.json                 # TypeScript configuration
├── 📄 eslint.config.js              # ESLint configuration
├── 📄 .nvmrc                        # Node version specification
├── 📄 .gitignore                    # Git ignore rules
├── 📄 README.md                     # Project overview
└── 📄 PROJECT-STRUCTURE.md          # This file
```

## 🎯 Organization Principles

### 1. **Clean Architecture Layers**
- **Domain Layer** (`src/domain/`): Core business logic and entities
- **Application Layer** (`src/app/`): Use cases and application services
- **Infrastructure Layer** (`src/infra/`): External dependencies and implementations
- **HTTP Layer** (`src/http/`): CLI and HTTP interfaces

### 2. **Separation of Concerns**
- **Source Code** (`src/`): Core application logic organized by architectural layers
- **Tests** (`tests/`): All test files organized by type
- **Documentation** (`docs/`): Comprehensive documentation
- **Data** (`data/`): Sample and test data files
- **Tools** (`tools/`): Development and build tools
- **Compiled Output** (`dist/`): Generated JavaScript files

### 3. **Test Organization**
- **Unit Tests** (`tests/unit/`): Individual component testing
- **Integration Tests** (`tests/integration/`): Component interaction testing
- **Performance Tests** (`tests/performance/`): System performance testing

## 🏗️ Architecture Overview

### Domain Layer (`src/domain/`)
Contains the core business logic and entities:
- **Entities**: Driver, Ride, Assignment
- **Value Objects**: Coordinates, Time, Cost
- **Repositories**: Data access interfaces
- **Services**: Domain-specific business logic

### Application Layer (`src/app/`)
Contains use cases and application services:
- **Assignment Service**: Main ride assignment logic
- **Cost Calculator**: Cost calculation algorithms
- **Validation**: Business rule validation

### Infrastructure Layer (`src/infra/`)
Contains external dependencies and implementations:
- **Geographic Services**: Distance and routing calculations
- **OSRM Integration**: External routing service
- **Data Parsing**: Input/output data handling

### HTTP Layer (`src/http/`)
Contains interfaces and controllers:
- **CLI Interface**: Command-line application
- **Routes**: HTTP endpoints (if applicable)
- **Middleware**: Request/response processing

## 🔧 Configuration Files

### Package Management
- **package.json**: Dependencies, scripts, and metadata
- **package-lock.json**: Locked dependency versions
- **.nvmrc**: Node version specification

### TypeScript
- **tsconfig.json**: TypeScript compiler configuration
- **test.config.ts**: Test-specific configuration

### Code Quality
- **eslint.config.js**: ESLint rules and configuration
- **.gitignore**: Git ignore patterns

## 🧪 Testing Structure

### Test Categories
1. **Unit Tests**: Test individual functions and classes
2. **Integration Tests**: Test component interactions
3. **Performance Tests**: Test system performance and scalability

### Test Utilities
- **test-helpers.ts**: Shared test utilities and factories
- **test.config.ts**: Centralized test configuration
- **Memory tests**: Performance and memory leak detection

## 📚 Documentation Structure

### User Documentation
- **README.md**: Quick start and overview
- **API.md**: Complete API reference with examples

### Developer Documentation
- **QA-BEST-PRACTICES.md**: Testing standards and guidelines
- **PROJECT-STRUCTURE.md**: This structural overview

### Future Documentation
- **ARCHITECTURE.md**: System design and architecture
- **PERFORMANCE.md**: Performance optimization guide
- **CONTRIBUTING.md**: Contribution guidelines

## 🛠️ Development Workflow

### Adding New Features
1. Add domain entities to `src/domain/`
2. Add use cases to `src/app/`
3. Add infrastructure implementations to `src/infra/`
4. Add interfaces to `src/http/`
5. Add tests to appropriate `tests/` subdirectory
6. Update documentation in `docs/`

### Adding New Tests
1. Determine test category (unit/integration/performance)
2. Add test file to appropriate `tests/` subdirectory
3. Follow naming conventions
4. Update test configuration if needed

### Adding Documentation
1. Add to appropriate `docs/` file
2. Update documentation index
3. Follow established format and style

## 🎯 Benefits of This Structure

### For Developers
- **Easy Navigation**: Clear file organization by architectural layers
- **Quick Understanding**: Self-documenting structure
- **Scalability**: Easy to add new features and components
- **Maintainability**: Clear separation of concerns

### For Reviewers
- **Clear Architecture**: Easy to understand the system design
- **Test Coverage**: Comprehensive testing structure
- **Documentation**: Well-documented codebase
- **Standards**: Consistent coding and testing practices

### For Users
- **Reliability**: Well-tested and documented system
- **Performance**: Optimized algorithms and implementations
- **Usability**: Clear CLI interface and documentation
- **Extensibility**: Easy to add new features and strategies

## 🔄 Migration Notes

This structure represents a clean architecture approach that:
- Separates business logic from infrastructure concerns
- Makes the codebase more testable and maintainable
- Provides clear boundaries between different layers
- Enables easy addition of new features and strategies

The current implementation maintains backward compatibility while providing a foundation for future enhancements.