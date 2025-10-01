#!/bin/bash
# Add default exports to Facade files that are missing them
# Phase 3C Step 2

# Function to add default export if not present
add_default_export() {
    local file="$1"
    local class_name="$2"

    # Check if default export already exists
    if grep -q "export default $class_name" "$file"; then
        echo "SKIP: $file already has default export"
        return 0
    fi

    # Add default export at end of file
    echo "" >> "$file"
    echo "// Default export for backward compatibility" >> "$file"
    echo "export default $class_name;" >> "$file"

    echo "ADDED: export default $class_name to $file"
}

# EC domain facades
add_default_export "src/domains/ec/frameworks/iso27001-mapperFacade.ts" "ISO27001MapperFacade"
add_default_export "src/domains/ec/frameworks/soc2-automationFacade.ts" "SOC2AutomationFacade"
add_default_export "src/domains/ec/integrations/phase3-integrationFacade.ts" "Phase3IntegrationFacade"

# Count changes
echo ""
echo "Default exports added successfully"
