# Terraform Test

Terraform's built-in testing framework enables module authors to validate that configuration updates don't introduce breaking changes. Tests execute against temporary resources, protecting existing infrastructure and state files.

## Table of Contents

1. [Core Concepts](#core-concepts)
2. [File Structure](#file-structure)
3. [Test Configuration](#test-configuration-tftesthcl)
4. [Mock Providers](#mock-providers)
5. [Test Execution](#test-execution)
6. [Common Test Patterns](#common-test-patterns-unit-tests---plan-mode)
7. [Integration Testing](#integration-testing)
8. [Best Practices](#best-practices)
9. [CI/CD Integration](#cicd-integration)
10. [Troubleshooting](#troubleshooting)
11. [Example Test Suite](#example-test-suite)

## Core Concepts

**Test File**: A `.tftest.hcl` or `.tftest.json` file containing test configuration and run blocks that validate your Terraform configuration.

**Test Block**: Optional configuration block that defines test-wide settings (available since Terraform 1.6.0).

**Run Block**: Defines a single test scenario with optional variables, provider configurations, and assertions. Each test file requires at least one run block.

**Assert Block**: Contains conditions that must evaluate to true for the test to pass. Failed assertions cause the test to fail.

**Mock Provider**: Simulates provider behavior without creating real infrastructure (available since Terraform 1.7.0).

**Test Modes**: Tests run in apply mode (default, creates real infrastructure) or plan mode (validates logic without creating resources).

## File Structure

Terraform test files use the `.tftest.hcl` or `.tftest.json` extension and are typically organized in a `tests/` directory. Use clear naming conventions to distinguish between unit tests (plan mode) and integration tests (apply mode):

```
my-module/
├── main.tf
├── variables.tf
├── outputs.tf
└── tests/
    ├── validation_unit_test.tftest.hcl      # Unit test (plan mode)
    ├── edge_cases_unit_test.tftest.hcl      # Unit test (plan mode)
    └── full_stack_integration_test.tftest.hcl  # Integration test (apply mode - creates real resources)
```

### Test File Components

A test file contains:
- **Zero to one** `test` block (configuration settings)
- **One to many** `run` blocks (test executions)
- **Zero to one** `variables` block (input values)
- **Zero to many** `provider` blocks (provider configuration)
- **Zero to many** `mock_provider` blocks (mock provider data, since v1.7.0)

**Important**: The order of `variables` and `provider` blocks doesn't matter. Terraform processes all values within these blocks at the beginning of the test operation.

## Test Configuration (.tftest.hcl)

### Test Block

The optional `test` block configures test-wide settings:

```hcl
test {
  parallel = true  # Enable parallel execution for all run blocks (default: false)
}
```

### Run Block

Each `run` block executes a command against your configuration. Run blocks execute **sequentially by default**.

**Basic Integration Test (Apply Mode - Default):**

```hcl
run "test_instance_creation" {
  command = apply

  assert {
    condition     = aws_instance.example.id != ""
    error_message = "Instance should be created with a valid ID"
  }
}
```

**Unit Test (Plan Mode):**

```hcl
run "test_default_configuration" {
  command = plan

  assert {
    condition     = aws_instance.example.instance_type == "t2.micro"
    error_message = "Instance type should be t2.micro by default"
  }
}
```

**Run Block Attributes:**

- `command` - Either `apply` (default) or `plan`
- `plan_options` - Configure plan behavior
- `variables` - Override test-level variable values
- `module` - Reference alternate modules for testing
- `providers` - Customize provider availability
- `assert` - Validation conditions (multiple allowed)
- `expect_failures` - Specify expected validation failures
- `state_key` - Manage state file isolation (since v1.9.0)
- `parallel` - Enable parallel execution when set to `true` (since v1.9.0)

### Plan Options

```hcl
run "test_refresh_only" {
  command = plan

  plan_options {
    mode    = refresh-only  # "normal" (default) or "refresh-only"
    refresh = true
    replace = [aws_instance.example]
    target  = [aws_instance.example]
  }
}
```

### Variables Block

Define variables at the test file level (applied to all run blocks) or within individual run blocks.

**Important**: Variables defined in test files take the **highest precedence**, overriding environment variables, variables files, or command-line input.

```hcl
# File-level variables (applied to all run blocks)
variables {
  aws_region    = "us-west-2"
  instance_type = "t2.micro"
}

run "test_with_override" {
  command = plan

  # Run-level variables override file-level
  variables {
    instance_type = "t3.large"
  }
}
```

**Referencing prior run block outputs:**

```hcl
run "setup_vpc" {
  command = apply
}

run "test_with_vpc_output" {
  command = plan

  variables {
    vpc_id = run.setup_vpc.vpc_id
  }
}
```

### Assert Block

Assert blocks validate conditions within run blocks. All assertions must pass for the test to succeed.

```hcl
assert {
  condition     = <expression>
  error_message = "failure description"
}
```

**Complex Conditions:**

```hcl
assert {
  condition = alltrue([
    for subnet in aws_subnet.private :
    can(regex("^10\\.0\\.", subnet.cidr_block))
  ])
  error_message = "All private subnets should use 10.0.0.0/8 CIDR range"
}
```

### Expect Failures Block

Test that certain conditions intentionally fail. The test **passes** if the specified checkable objects report an issue.

```hcl
run "test_invalid_input_rejected" {
  command = plan

  variables {
    instance_count = -1
  }

  expect_failures = [
    var.instance_count
  ]
}
```

### Module Block

Test a specific module rather than the root configuration.

**Supported sources:** Local modules (`./modules/vpc`), public registry (`terraform-aws-modules/vpc/aws`), private registry.
**Unsupported:** Git repos, HTTP URLs, S3/GCS.

```hcl
run "test_vpc_module" {
  command = plan

  module {
    source = "./modules/vpc"
  }

  variables {
    cidr_block = "10.0.0.0/16"
  }
}
```

### Parallel Execution

Run blocks execute **sequentially by default**. Enable parallel with `parallel = true`.

**Requirements:** No inter-run output references, different state files, explicit `parallel = true`.

```hcl
run "test_module_a" {
  command  = plan
  parallel = true
  module { source = "./modules/module-a" }
}

run "test_module_b" {
  command  = plan
  parallel = true
  module { source = "./modules/module-b" }
}
```

## Mock Providers

Mock providers simulate provider behavior without creating real infrastructure (available since Terraform 1.7.0).

```hcl
mock_provider "aws" {
  mock_resource "aws_instance" {
    defaults = {
      id            = "i-1234567890abcdef0"
      instance_type = "t2.micro"
      ami           = "ami-12345678"
    }
  }

  mock_data "aws_ami" {
    defaults = {
      id = "ami-12345678"
    }
  }
}

run "test_with_mocks" {
  command = plan

  assert {
    condition     = aws_instance.example.id == "i-1234567890abcdef0"
    error_message = "Mock instance ID should match"
  }
}
```

**Key benefits:** No cloud costs, no credentials needed, fast execution, predictable results.
**Limitations:** Plan mode only, may not reflect real provider behavior, computed values may differ.

## Test Execution

```bash
terraform test                                    # Run all tests
terraform test tests/defaults.tftest.hcl          # Run specific file
terraform test -verbose                           # Verbose output
terraform test -test-directory=integration-tests  # Custom directory
terraform test -filter=test_vpc_configuration     # Filter by name
terraform test -no-cleanup                        # Keep resources for debugging
```

## Common Test Patterns (Unit Tests - Plan Mode)

### Testing Module Outputs

```hcl
run "test_module_outputs" {
  command = plan

  assert {
    condition     = output.vpc_id != null
    error_message = "VPC ID output must be defined"
  }

  assert {
    condition     = can(regex("^vpc-", output.vpc_id))
    error_message = "VPC ID should start with 'vpc-'"
  }
}
```

### Testing Conditional Resources

```hcl
run "test_conditional_created" {
  command = plan
  variables { create_nat_gateway = true }

  assert {
    condition     = length(aws_nat_gateway.main) == 1
    error_message = "NAT gateway should be created when enabled"
  }
}

run "test_conditional_not_created" {
  command = plan
  variables { create_nat_gateway = false }

  assert {
    condition     = length(aws_nat_gateway.main) == 0
    error_message = "NAT gateway should not be created when disabled"
  }
}
```

### Testing Validation Rules

```hcl
run "test_valid_environment" {
  command = plan
  variables { environment = "staging" }

  assert {
    condition     = var.environment == "staging"
    error_message = "Valid environment should be accepted"
  }
}

run "test_invalid_environment" {
  command = plan
  variables { environment = "invalid" }

  expect_failures = [var.environment]
}
```

## Integration Testing

```hcl
run "integration_test_full_stack" {
  # command defaults to apply

  variables {
    environment = "integration-test"
    vpc_cidr    = "10.100.0.0/16"
  }

  assert {
    condition     = aws_vpc.main.id != ""
    error_message = "VPC should be created"
  }
}

# Cleanup happens automatically in reverse run block order
```

## Best Practices

1. **Naming**: Unit tests `*_unit_test.tftest.hcl`, integration tests `*_integration_test.tftest.hcl`
2. **Use plan mode** for fast unit tests, apply mode for integration tests
3. **Mock providers** for isolated testing without credentials (Terraform 1.7.0+)
4. **Meaningful assertions** with clear error messages that help diagnose failures
5. **Test isolation** — independent run blocks where possible
6. **Variable coverage** — test different combinations to validate all code paths
7. **Negative testing** — use `expect_failures` for invalid inputs
8. **Parallel execution** — `parallel = true` for independent tests with different state files
9. **CI integration** — run `terraform test` in pipelines to catch issues early

## CI/CD Integration

### GitHub Actions

```yaml
name: Terraform Tests
on:
  pull_request:
    branches: [main]

jobs:
  terraform-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: 1.9.0
      - run: terraform fmt -check -recursive
      - run: terraform init
      - run: terraform validate
      - run: terraform test -verbose
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Assertion failures | Use `-verbose` flag, check actual vs expected values |
| Missing credentials | Use mock providers for unit tests |
| Missing dependencies | Use sequential run blocks or setup runs |
| Slow tests | Use `command = plan`, mocks, `parallel = true` |
| State conflicts | Use different modules or `state_key` attribute |
| Unsupported module source | Convert Git/HTTP sources to local or registry modules |

## Example Test Suite

See the complete VPC module test suite example covering unit tests (plan mode), integration tests (apply mode), and mock provider tests in the full terraform-test reference.

---

*Based on: [Terraform Testing Documentation](https://developer.hashicorp.com/terraform/language/tests)*
