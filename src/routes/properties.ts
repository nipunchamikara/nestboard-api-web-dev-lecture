import { Router } from 'express';

export const propertiesRouter: Router = Router()

const PROPERTIES = [
  {
    id: 'prop-001',
    title: 'Sunset Apartment',
    location: 'Ethul Kotte, Sri Lanka',
    type: 'Apartment',
    price: '20K',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=500&fit=crop',
  },
  {
    id: 'prop-002',
    title: 'Palm House',
    location: 'Gampaha, Sri Lanka',
    type: 'House',
    price: '18K',
    rating: 4.2,
    image: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=400&h=500&fit=crop',
  },
];

propertiesRouter.get('/', (_req, res) => {
    res.json(PROPERTIES)
})

propertiesRouter.get('/:id', (req, res) => {
    const property = PROPERTIES.find(p => p.id === req.params.id)
    if (!property) {
        res.status(404).json({ error: 'Property not found' });
        return;
    }
    res.json(property);
})

propertiesRouter.post('/', (req, res) => {
    const newProperty = req.body;
    PROPERTIES.push(newProperty);
    res
    .status(201)
    .location(`${req.baseUrl}/${newProperty.id}`)
    .json(newProperty);
})

// --- Session 07 homework ---

propertiesRouter.delete('/:id', (req, res) => {
    const index = PROPERTIES.findIndex(p => p.id === req.params.id);
    if (index === -1) {
        res.status(404).json({ error: 'Property not found' });
        return;
    }
    PROPERTIES.splice(index, 1);
    res.status(204).send();
})

const ROOMS = [
    { id: 'r1', propertyId: 'prop-001', name: 'Room A', price: '20,000', seatsTotal: 2, seatsFree: 1, hasAC: true },
    { id: 'r2', propertyId: 'prop-001', name: 'Room B', price: '22,000', seatsTotal: 2, seatsFree: 2, hasAC: true },
    { id: 'r3', propertyId: 'prop-002', name: 'Room C', price: '18,000', seatsTotal: 3, seatsFree: 0, hasAC: false },
];

propertiesRouter.get('/:id/rooms', (req, res) => {
    const property = PROPERTIES.find(p => p.id === req.params.id);
    if (!property) {
        res.status(404).json({ error: 'Property not found' });
        return;
    }
    res.json(ROOMS.filter(r => r.propertyId === req.params.id));
})
