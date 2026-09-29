import React from 'react';
import { productRepository } from '@/repositories/product.repository';
import { ProductForm } from '@/components/admin/ProductForm';

export const revalidate = 0;

export default async function NewProductPage() {
  const categories = await productRepository.getAllCategories();
  return <ProductForm categories={categories} />;
}
