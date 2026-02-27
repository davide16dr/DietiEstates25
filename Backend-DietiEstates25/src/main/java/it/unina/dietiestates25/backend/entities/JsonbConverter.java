package it.unina.dietiestates25.backend.entities;

import java.sql.SQLException;
import java.util.Collections;
import java.util.Map;

import org.postgresql.util.PGobject;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class JsonbConverter implements AttributeConverter<Map<String, Object>, PGobject> {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final TypeReference<Map<String, Object>> TYPE = new TypeReference<>() {};

    @Override
    public PGobject convertToDatabaseColumn(Map<String, Object> attribute) {
        try {
            PGobject pgObject = new PGobject();
            pgObject.setType("jsonb");
            if (attribute == null) {
                pgObject.setValue("{}");
            } else {
                pgObject.setValue(MAPPER.writeValueAsString(attribute));
            }
            return pgObject;
        } catch (SQLException | com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new IllegalArgumentException("Cannot serialize JSONB", e);
        }
    }

    @Override
    public Map<String, Object> convertToEntityAttribute(PGobject dbData) {
        try {
            if (dbData == null || dbData.getValue() == null || dbData.getValue().isBlank()) {
                return Collections.emptyMap();
            }
            return MAPPER.readValue(dbData.getValue(), TYPE);
        } catch (Exception e) {
            throw new IllegalArgumentException("Cannot deserialize JSONB", e);
        }
    }
}
