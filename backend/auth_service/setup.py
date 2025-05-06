from setuptools import setup, find_packages

setup(
    name="auth_service",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "fastapi>=0.100.0",
        "python-jose[cryptography]>=3.3.0",
        "passlib[bcrypt]>=1.7.4",
        "python-multipart>=0.0.6",
        "pydantic[email]>=2.0.0",
        "sqlalchemy>=2.0.0",
        "authlib>=1.2.0",
    ],
)