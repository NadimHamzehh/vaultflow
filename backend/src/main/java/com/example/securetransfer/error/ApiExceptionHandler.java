package com.example.securetransfer.error;

import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {
  @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
  @ResponseStatus(HttpStatus.BAD_REQUEST)
  public Map<String,String> handleBadReq(RuntimeException ex){ return Map.of("error", ex.getMessage()); }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  @ResponseStatus(HttpStatus.BAD_REQUEST)
  public Map<String,String> handleValidation(MethodArgumentNotValidException ex){
    return Map.of("error","Validation failed");
  }
}
