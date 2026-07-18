package com.agriconnect.order;
import org.springframework.boot.*;import org.springframework.boot.autoconfigure.*;import org.springframework.scheduling.annotation.EnableScheduling;import org.springframework.context.annotation.Bean;import com.fasterxml.jackson.databind.ObjectMapper;
@SpringBootApplication @EnableScheduling public class OrderApplication{public static void main(String[]a){SpringApplication.run(OrderApplication.class,a);}@Bean ObjectMapper objectMapper(){return new ObjectMapper().findAndRegisterModules();}}
