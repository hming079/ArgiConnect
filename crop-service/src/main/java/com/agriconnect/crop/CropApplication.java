package com.agriconnect.crop;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.context.annotation.Bean;
import com.fasterxml.jackson.databind.ObjectMapper;
@SpringBootApplication @EnableScheduling
public class CropApplication { public static void main(String[] args){SpringApplication.run(CropApplication.class,args);} @Bean ObjectMapper objectMapper(){return new ObjectMapper().findAndRegisterModules();} }
