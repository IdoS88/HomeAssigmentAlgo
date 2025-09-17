# Project Structure

This document outlines the organized structure of the Ride Assignment Algorithm project.

## 📁 Directory Structure

```
HomeAssigmentAlgo/
├── 📁 src/                          # Source code
│   ├── 📄 cli.ts                    # Command-line interface
│   ├── 📄 cost.ts                   # Cost calculation utilities
│   ├── 📄 domain.ts                 # Core domain models and validation
│   ├── 📄 geo.ts                    # Geographic calculations
│   ├── 📄 legal.ts                  # Business rule validation
│   ├── 📄 osrm.ts                   # OSRM routing integration
│   ├── 📄 strategy.ts               # Strategy interface
│   ├── 📄 test-helpers.ts           # Test utilities
│   └── 📁 strategies/               # Assignment strategies
│       ├── 📄 greedy.ts             # Greedy assignment algorithm
│       └── 📄 minCostFlow.ts        # Minimum cost flow algorithm
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
│
├── 📁 docs/                         # Documentation
│   ├── 📄 README.md                 # Documentation index
│   ├── 📄 API.md                    # API reference
│   └── 📄 QA-BEST-PRACTICES.md      # Testing standards
│
├── 📁 data/                         # Sample data files
│   ├── 📄 drivers.json              # Original drivers data
│   ├── 📄 rides.json                # Original rides data
│   ├── 📄 enhanced-drivers.json     # Enhanced drivers data
│   ├── 📄 enhanced-rides.json       # Enhanced rides data
│   ├── 📄 sample-drivers.json       # Sample drivers data
│   └── 📄 sample-rides.json         # Sample rides data
│
├── 📁 scripts/                      # Utility scripts
│   ├── 📄 memory-test.js            # Detailed memory testing
│   ├── 📄 simple-memory-test.js     # Simple memory testing
│   └── 📄 test-simple.js            # Simple test runner
│
├── 📁 tools/                        # Development tools
│   ├── 📄 generate-data.ts          # Data generation utility
│   ├── 📄 seed.example.md           # Example seed file
│   └── 📄 seed.md                   # Seed configuration
│
├── 📄 package.json                  # Project configuration
├── 📄 tsconfig.json                 # TypeScript configuration
├── 📄 eslint.config.js              # ESLint configuration
├── 📄 test.config.ts                # Test configuration
├── 📄 .gitignore                    # Git ignore rules
├── 📄 README.md                     # Project overview
└── 📄 PROJECT-STRUCTURE.md          # This file
```

## 🎯 Organization Principles

### 1. **Separation of Concerns**
- **Source Code** (`src/`): Core application logic
- **Tests** (`tests/`): All test files organized by type
- **Documentation** (`docs/`): Comprehensive documentation
- **Data** (`data/`): Sample and test data files
- **Scripts** (`scripts/`): Utility and maintenance scripts
- **Tools** (`tools/`): Development and build tools

### 2. **Test Organization**
- **Unit Tests** (`tests/unit/`): Individual component testing
- **Integration Tests** (`tests/integration/`): Component interaction testing
- **Performance Tests** (`tests/performance/`): Performance and load testing

### 3. **Documentation Structure**
- **README.md**: Project overview and quick start
- **API.md**: Complete API reference
- **QA-BEST-PRACTICES.md**: Testing and quality standards
- **PROJECT-STRUCTURE.md**: This structural overview

### 4. **Data Management**
- **Sample Data**: Clean, well-documented example files
- **Enhanced Data**: Extended datasets for testing
- **Generated Data**: Tool-generated test data (excluded from git)

## 🚀 Key Features of This Structure

### ✅ **Professional Organization**
- Clear separation between source, tests, docs, and utilities
- Industry-standard directory naming conventions
- Logical grouping of related files

### ✅ **Scalability**
- Easy to add new strategies in `src/strategies/`
- Simple to add new test types in `tests/`
- Extensible documentation structure

### ✅ **Maintainability**
- Self-documenting structure
- Clear file naming conventions
- Comprehensive documentation

### ✅ **Developer Experience**
- Easy navigation and file discovery
- Clear separation of concerns
- Comprehensive tooling support

## 📋 File Naming Conventions

### Source Files
- **kebab-case** for multi-word files: `min-cost-flow.ts`
- **camelCase** for single concepts: `domain.ts`, `geo.ts`
- **Descriptive names**: `test-helpers.ts`, `generate-data.ts`

### Test Files
- **Pattern**: `*.test.ts` for unit tests
- **Pattern**: `*.integration.test.ts` for integration tests
- **Pattern**: `*.performance.test.ts` for performance tests
- **Descriptive names**: `shift-availability.test.ts`

### Documentation Files
- **UPPERCASE** for main documents: `README.md`, `API.md`
- **kebab-case** for detailed docs: `project-structure.md`
- **Descriptive names**: `qa-best-practices.md`

## 🔧 Configuration Files

### Package Management
- **package.json**: Dependencies, scripts, and metadata
- **package-lock.json**: Locked dependency versions

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
1. Add source code to `src/`
2. Add tests to appropriate `tests/` subdirectory
3. Update documentation in `docs/`
4. Update this structure document if needed

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
- **Easy Navigation**: Clear file organization
- **Quick Understanding**: Self-documenting structure
- **Efficient Development**: Logical file placement

### For Maintainers
- **Easy Maintenance**: Clear separation of concerns
- **Simple Updates**: Organized change management
- **Quality Assurance**: Comprehensive testing structure

### For Users
- **Clear Documentation**: Easy to find information
- **Professional Appearance**: Well-organized project
- **Easy Setup**: Clear installation and usage instructions

## 🔄 Maintenance Guidelines

### Regular Tasks
- Keep documentation up-to-date
- Maintain test coverage
- Update dependencies regularly
- Review and clean up unused files

### When Adding Files
- Follow established naming conventions
- Place files in appropriate directories
- Update relevant documentation
- Add tests for new functionality

### When Modifying Structure
- Update this document
- Update documentation references
- Update build and test configurations
- Communicate changes to team

---

This structure provides a solid foundation for a professional, maintainable, and scalable TypeScript project. It follows industry best practices and provides clear organization for all project components.
