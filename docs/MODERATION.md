<div align="center">
  <a href="https://gemsofindia.org/">
    <img src="https://gemsofindia.org/logo.png" alt="Gems of India" width="50" height="50">
    <h1 style="margin-bottom: 0">gemsofindia.org</h1>
   </a>
    <h2 style="margin-top: 0">Moderation System</h2>
</div>

## Overview

The platform has a scoped moderation system that allows admins to assign moderators with specific permissions to manage entities.

## Roles

- **Admin**: Full access to all entities and admin panel
- **Moderator**: Limited access based on assigned scope
- **User**: Can only edit their own pending entities

## Moderator Scopes

When promoting a user to moderator, admins can assign one of four scope types:

### 1. All Entities

Moderator can edit any entity in the system (full moderator access).

### 2. State-Level

Moderator can only edit entities within a specific state (e.g., Maharashtra, Karnataka).

### 3. City-Level

Moderator can only edit entities within a specific city and state (e.g., Mumbai, Maharashtra).

### 4. Entity-Specific

Moderator can edit a specific entity and all its children (e.g., IIT Bombay + all departments/programs under it).

## How It Works

1. **Admin assigns scope**: Admin promotes user to moderator and selects their scope
2. **Moderator edits entities**: Moderator can view all entities but can only edit entities within their scope
3. **Permission checks**: System validates scope before allowing any edit operation
4. **Scope updates**: Admin can change moderator's scope at any time
5. **Auto-removal**: When demoting moderator to user, scope is automatically removed

## Assigning Moderators

1. Go to Admin Dashboard
2. Find user in the user list
3. Click three-dot menu → "Make Moderator"
4. Select scope type and configure
5. Click "Assign Role"

## Editing Moderator Scope

1. Go to Admin Dashboard
2. Find moderator in the user list (shows current scope below role badge)
3. Click three-dot menu → "Edit Scope"
4. Update scope configuration
5. Click "Update Scope"

## Security

- All permission checks happen server-side
- Moderators cannot bypass their assigned scope
- Only admins can assign or modify scopes
- Scopes are automatically removed when role changes
