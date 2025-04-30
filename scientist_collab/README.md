# Scientists Collaboration Platform

A web platform for scientists to share research, upload publications, and collaborate through forum discussions.

## Features

- **User Authentication**: Register, login, profile management
- **Publication Sharing**: Upload and download PDF publications with metadata
- **Discussion Forums**: Create topics and participate in scientific discussions
- **Responsive Design**: Built with Bootstrap 5 for a clean, modern interface

## Technology Stack

- **Backend**: Django 5.1
- **Database**: MySQL
- **Frontend**: HTML, CSS, JavaScript, Bootstrap 5
- **File Storage**: Local file system (with easy migration to Azure Blob Storage)
- **Deployment**: Prepared for Docker and Azure deployment

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd scientist_collab
```

### 2. Set up a virtual environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Create MySQL database

```sql
CREATE DATABASE scientist_collab CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
```

### 5. Configure environment variables

Create a `.env` file in the project root with:

```
DEBUG=True
SECRET_KEY=your_secret_key_here
DB_NAME=scientist_collab
DB_USER=root
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=3306
```

### 6. Run migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 7. Create admin user

```bash
python manage.py createsuperuser
```

### 8. Create forums

1. Log in to the admin panel at http://localhost:8000/admin/
2. Create a few initial forum categories

### 9. Run the development server

```bash
python manage.py runserver
```

Access the site at http://localhost:8000

## Preparing for Production

### For Docker Deployment

1. Build the Docker image:
```bash
docker build -t scientist-collab .
```

2. Run the container:
```bash
docker run -p 8000:8000 scientist-collab
```

### For Azure Deployment

1. Create Azure App Service
2. Configure MySQL database on Azure
3. Update environment variables
4. Deploy using GitHub Actions or Azure DevOps

## License

This project is licensed under the MIT License - see the LICENSE file for details. 