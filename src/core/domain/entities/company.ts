export interface Company {
  id: string;
  nif: string;
  name: string;
  businessName: string;
  address: string;
  email: string;
  nationality?: string;
  logo?: string;
  codigoCuentaCotizacion?: string;
  createdAt?: string;
  updatedAt?: string;
}
