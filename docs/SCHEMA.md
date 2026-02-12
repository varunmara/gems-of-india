<div align="center">
  <a href="https://gemsofindia.org/">
    <img src="https://gemsofindia.org/logo.png" alt="Gems of India" width="50" height="50">
    <h1 style="margin-bottom: 0">gemsofindia.org</h1>
   </a>
    <h2 style="margin-top: 0">Database Schema</h2>
    <p>This document describes the database schema for the Gems of India application. The database uses PostgreSQL with Drizzle ORM for type-safe database operations.</p>
</div>

## Table of Contents

1. [Users](#users)
2. [Entities](#entities)
3. [Reviews](#reviews)
4. [Tags](#tags)
5. [Relationships](#relationships)
6. [Enums](#enums)
7. [Indexes](#indexes)
8. [Migrations](#migrations)

## Users

### `user`

Stores user account information.

| _Column_           | _Type_                             | _Description_               |
| ------------------ | ---------------------------------- | --------------------------- |
| **id**             | UUID                               | Primary key                 |
| **name**           | string                             | User's full name            |
| **email**          | string                             | Unique email address        |
| **email_verified** | timestamp                          | When the email was verified |
| **image**          | string                             | URL to profile picture      |
| **role**           | enum('user', 'moderator', 'admin') | User role                   |
| **created_at**     | timestamp                          | Account creation time       |
| **updated_at**     | timestamp                          | Last update time            |

## Entities

### `entity`

Represents politicians, officials, departments, or organizations.

| _Column_        | _Type_                                       | _Description_               |
| --------------- | -------------------------------------------- | --------------------------- |
| **id**          | UUID                                         | Primary key                 |
| **name**        | string                                       | Display name                |
| **slug**        | string                                       | URL-friendly identifier     |
| **type**        | enum('person', 'department', 'organization') | Entity type                 |
| **status**      | enum('pending', 'published', 'rejected')     | Moderation status           |
| **description** | text                                         | Detailed description        |
| **metadata**    | jsonb                                        | Type-specific metadata      |
| **created_by**  | UUID (FK)                                    | User who created the entity |
| **created_at**  | timestamp                                    | Creation time               |
| **updated_at**  | timestamp                                    | Last update time            |

## Reviews

### `review`

User-submitted reviews of entities.

| _Column_       | _Type_                                  | _Description_         |
| -------------- | --------------------------------------- | --------------------- |
| **id**         | UUID                                    | Primary key           |
| **entity_id**  | UUID (FK)                               | Entity being reviewed |
| **user_id**    | UUID (FK)                               | Author of the review  |
| **rating**     | integer                                 | Rating (1-5)          |
| **title**      | string                                  | Review title          |
| **content**    | text                                    | Review content        |
| **status**     | enum('pending', 'published', 'flagged') | Review status         |
| **created_at** | timestamp                               | Creation time         |
| **updated_at** | timestamp                               | Last update time      |

## Tags

### `tag`

Categories for organizing content.

| _Column_        | _Type_ | _Description_           |
| --------------- | ------ | ----------------------- |
| **id**          | UUID   | Primary key             |
| **name**        | string | Tag name                |
| **slug**        | string | URL-friendly identifier |
| **description** | text   | Optional description    |

### `review_tag`

Many-to-many relationship between reviews and tags.

| _Column_       | _Type_    | _Description_ |
| -------------- | --------- | ------------- |
| **review_id**  | UUID (FK) | Review ID     |
| **tag_id**     | UUID (FK) | Tag ID        |
| **created_at** | timestamp | Creation time |

## Relationships

- A `user` can create many `entity` records (one-to-many)
- A `user` can write many `review` records (one-to-many)
- An `entity` can have many `review` records (one-to-many)
- A `review` can have many `tag` records (many-to-many via `review_tag`)

## Enums

### `user_role`

- `user`: Regular user
- `moderator`: Can moderate content
- `admin`: Full system access

### `entity_type`

- `person`: Individual politician or official
- `department`: Government department
- `organization`: Political party or organization

### `entity_status`

- `pending`: Awaiting moderation
- `published`: Visible to all
- `rejected`: Not approved

## Indexes

- Primary keys on all tables
- Unique index on `user.email`
- Unique index on `entity.slug`
- Index on `review.entity_id` for faster lookups
- Full-text search index on `entity.name` and `entity.description`
