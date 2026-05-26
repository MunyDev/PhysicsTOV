import scipy.integrate
import sympy
from math import pi
k = 3000  # Stiffness of material
gamma = 3000 # reversible adiabatic (or )
rho_mass = 3000
G = 6.67 * pow(10, -11)
def m_of_r(r):
    return (4/3) * pi * (pow(r, 3)) * rho_mass
def model(P, r):
    rho = pow((P/k), (1/gamma))
    mass = m_of_r(r)
    
    