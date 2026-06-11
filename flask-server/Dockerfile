FROM python:3.10

WORKDIR /app

RUN apt-get update -y

RUN pip install Flask
RUN pip install flask_cors
RUN pip install --user ur_rtde
RUN pip install ortools numpy

EXPOSE 5000