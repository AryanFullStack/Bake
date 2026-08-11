import { Canvas, RouteStoryboard } from "tempo-sdk/canvas";

export default function VariableProductsUxCanvas() {
  return (
    <Canvas name="Variable Products UX">
      <RouteStoryboard
        id="CustomerProductDetail"
        name="Customer · Variable product detail"
        route="/products/royal-red-velvet"
        layout={{ x: 0, y: 0, width: 600, height: 400 }}
      />
      <RouteStoryboard
        id="AdminProductEditor"
        name="Admin · Product and variation matrix"
        route="/admin/products"
        layout={{ x: 650, y: 0, width: 600, height: 400 }}
      />
    </Canvas>
  );
}
