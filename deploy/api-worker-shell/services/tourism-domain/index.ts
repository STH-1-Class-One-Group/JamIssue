/*
 * File: index.ts
 * Purpose: Re-export the tourism read-domain public surface.
 * Primary Responsibility: Keep route handlers decoupled from tourism-domain file layout.
 * Design Intent: Preserve a small import boundary as the domain grows beyond the first read endpoint.
 * Non-Goals: This file does not implement mapping, querying, or HTTP response creation.
 * Dependencies: Tourism read service.
 */
export { loadTourismPlaces } from './read-service';
