package terreno.programacionlinealbackend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import terreno.programacionlinealbackend.models.DTOs.ErrorRespuesta;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorRespuesta manejarArgumentoInvalido(IllegalArgumentException ex) {
        return new ErrorRespuesta("Error de validación", ex.getMessage());
    }

    @ExceptionHandler(IllegalStateException.class)
    @ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
    public ErrorRespuesta manejarEstadoInvalido(IllegalStateException ex) {
        return new ErrorRespuesta("Error de resolución", ex.getMessage());
    }
}
