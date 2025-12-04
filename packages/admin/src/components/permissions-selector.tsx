import { Permission } from '@longpoint/types';
import { Checkbox } from '@longpoint/ui/components/checkbox';
import { Field, FieldGroup, FieldLabel } from '@longpoint/ui/components/field';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

const ALL_PERMISSIONS = Object.values(Permission)
  .filter((permission) => permission !== Permission.SUPER)
  .sort();

// Group permissions by category
type PermissionCategory = {
  category: string;
  displayName: string;
  permissions: {
    read?: string;
    create?: string;
    update?: string;
    delete?: string;
  };
};

function groupPermissionsByCategory(): PermissionCategory[] {
  const categories = new Map<string, PermissionCategory>();

  ALL_PERMISSIONS.forEach((permission) => {
    const [category, action] = permission.split(':');
    const displayName = category
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    if (!categories.has(category)) {
      categories.set(category, {
        category,
        displayName,
        permissions: {},
      });
    }

    const categoryData = categories.get(category)!;
    if (action === 'read') categoryData.permissions.read = permission;
    if (action === 'create') categoryData.permissions.create = permission;
    if (action === 'update') categoryData.permissions.update = permission;
    if (action === 'delete') categoryData.permissions.delete = permission;
  });

  return Array.from(categories.values()).sort((a, b) =>
    a.displayName.localeCompare(b.displayName)
  );
}

const PERMISSION_CATEGORIES = groupPermissionsByCategory();

export type PermissionsSelectorProps = {
  value: string[];
  onChange: (permissions: string[]) => void;
  idPrefix: string;
};

type CategoryToggleProps = {
  category: PermissionCategory;
  toggleState: 'checked' | 'unchecked' | 'indeterminate';
  onToggle: (checked: boolean) => void;
  idPrefix: string;
  isExpanded: boolean;
  onExpandToggle: () => void;
};

function CategoryToggle({
  category,
  toggleState,
  onToggle,
  idPrefix,
  isExpanded,
  onExpandToggle,
}: CategoryToggleProps) {
  const isIndeterminate = toggleState === 'indeterminate';
  const isChecked = toggleState === 'checked';

  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={`${idPrefix}-${category.category}-toggle`}
        checked={isChecked}
        indeterminate={isIndeterminate}
        onCheckedChange={(checked) => onToggle(checked === true)}
      />
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onExpandToggle();
        }}
        className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
        aria-label={isExpanded ? 'Collapse' : 'Expand'}
      >
        <FieldLabel
          htmlFor={`${idPrefix}-${category.category}-toggle`}
          className="font-medium text-sm cursor-pointer"
        >
          {category.displayName}
        </FieldLabel>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

export function PermissionsSelector({
  value,
  onChange,
  idPrefix,
}: PermissionsSelectorProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  const toggleCategoryExpanded = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };
  const handlePermissionChange = (
    permission: string | undefined,
    checked: boolean,
    category: PermissionCategory
  ) => {
    if (!permission) return;

    let newPermissions: string[];
    if (checked) {
      newPermissions = [...value, permission];
      // Auto-select READ if a write operation is selected
      if (
        permission !== category.permissions.read &&
        category.permissions.read &&
        !newPermissions.includes(category.permissions.read)
      ) {
        newPermissions.push(category.permissions.read);
      }
    } else {
      newPermissions = value.filter((p) => p !== permission);
      // If unchecking a write operation and no other write operations remain,
      // allow READ to be unchecked too
      const hasWriteOperation =
        (category.permissions.create &&
          newPermissions.includes(category.permissions.create)) ||
        (category.permissions.update &&
          newPermissions.includes(category.permissions.update)) ||
        (category.permissions.delete &&
          newPermissions.includes(category.permissions.delete));

      if (
        !hasWriteOperation &&
        category.permissions.read &&
        newPermissions.includes(category.permissions.read)
      ) {
        // Allow READ to be unchecked if no write operations remain
        // (user can manually uncheck it)
      }
    }

    onChange(newPermissions);
  };

  const isReadAutoSelected = (category: PermissionCategory): boolean => {
    if (!category.permissions.read) return false;
    const hasWriteOperation =
      (category.permissions.create &&
        value.includes(category.permissions.create)) ||
      (category.permissions.update &&
        value.includes(category.permissions.update)) ||
      (category.permissions.delete &&
        value.includes(category.permissions.delete));

    return Boolean(
      hasWriteOperation && value.includes(category.permissions.read)
    );
  };

  const getCategoryPermissions = (category: PermissionCategory): string[] => {
    const permissions: string[] = [];
    if (category.permissions.read) permissions.push(category.permissions.read);
    if (category.permissions.create)
      permissions.push(category.permissions.create);
    if (category.permissions.update)
      permissions.push(category.permissions.update);
    if (category.permissions.delete)
      permissions.push(category.permissions.delete);
    return permissions;
  };

  const getCategoryToggleState = (
    category: PermissionCategory
  ): 'checked' | 'unchecked' | 'indeterminate' => {
    const categoryPermissions = getCategoryPermissions(category);
    const selectedCount = categoryPermissions.filter((p) =>
      value.includes(p)
    ).length;

    if (selectedCount === 0) return 'unchecked';
    if (selectedCount === categoryPermissions.length) return 'checked';
    return 'indeterminate';
  };

  const handleCategoryToggle = (
    category: PermissionCategory,
    checked: boolean
  ) => {
    const categoryPermissions = getCategoryPermissions(category);
    let newPermissions: string[];

    if (checked) {
      // Add all category permissions
      newPermissions = [...value];
      categoryPermissions.forEach((permission) => {
        if (!newPermissions.includes(permission)) {
          newPermissions.push(permission);
        }
      });
    } else {
      // Remove all category permissions
      newPermissions = value.filter((p) => !categoryPermissions.includes(p));
    }

    onChange(newPermissions);
  };

  return (
    <div className="space-y-6">
      {PERMISSION_CATEGORIES.map((category) => {
        const readAutoSelected = isReadAutoSelected(category);
        const hasRead = !!category.permissions.read;

        const toggleState = getCategoryToggleState(category);
        const isExpanded = expandedCategories.has(category.category);

        return (
          <div key={category.category} className="space-y-3">
            <CategoryToggle
              category={category}
              toggleState={toggleState}
              onToggle={(checked) => handleCategoryToggle(category, checked)}
              idPrefix={idPrefix}
              isExpanded={isExpanded}
              onExpandToggle={() => toggleCategoryExpanded(category.category)}
            />
            {isExpanded && (
              <FieldGroup className="flex  gap-4 pl-4">
                {hasRead && (
                  <Field orientation="horizontal" className="w-auto">
                    <Checkbox
                      id={`${idPrefix}-${category.category}-read`}
                      checked={value.includes(category.permissions.read!)}
                      disabled={readAutoSelected}
                      onCheckedChange={(checked) =>
                        handlePermissionChange(
                          category.permissions.read,
                          checked === true,
                          category
                        )
                      }
                    />
                    <FieldLabel
                      htmlFor={`${idPrefix}-${category.category}-read`}
                    >
                      Read
                    </FieldLabel>
                  </Field>
                )}
                {category.permissions.create && (
                  <Field orientation="horizontal" className="w-auto">
                    <Checkbox
                      id={`${idPrefix}-${category.category}-create`}
                      checked={value.includes(category.permissions.create!)}
                      onCheckedChange={(checked) =>
                        handlePermissionChange(
                          category.permissions.create,
                          checked === true,
                          category
                        )
                      }
                    />
                    <FieldLabel
                      htmlFor={`${idPrefix}-${category.category}-create`}
                    >
                      Create
                    </FieldLabel>
                  </Field>
                )}
                {category.permissions.update && (
                  <Field orientation="horizontal" className="w-auto">
                    <Checkbox
                      id={`${idPrefix}-${category.category}-update`}
                      checked={value.includes(category.permissions.update!)}
                      onCheckedChange={(checked) =>
                        handlePermissionChange(
                          category.permissions.update,
                          checked === true,
                          category
                        )
                      }
                    />
                    <FieldLabel
                      htmlFor={`${idPrefix}-${category.category}-update`}
                    >
                      Update
                    </FieldLabel>
                  </Field>
                )}
                {category.permissions.delete && (
                  <Field orientation="horizontal" className="w-auto">
                    <Checkbox
                      id={`${idPrefix}-${category.category}-delete`}
                      checked={value.includes(category.permissions.delete!)}
                      onCheckedChange={(checked) =>
                        handlePermissionChange(
                          category.permissions.delete,
                          checked === true,
                          category
                        )
                      }
                    />
                    <FieldLabel
                      htmlFor={`${idPrefix}-${category.category}-delete`}
                    >
                      Delete
                    </FieldLabel>
                  </Field>
                )}
              </FieldGroup>
            )}
          </div>
        );
      })}
    </div>
  );
}
