import math

import scipy.integrate
import sympy
from math import pi
k = 3000  # Stiffness of material
gamma = 3000 # reversible adiabatic (or )
rho_mass = 3000
M = 3000
G = 6.67 * pow(10, -11)
c = 299792458

def schwarzschild_radius(r):
    return (2 * G * M) / (r * c**2)

def m_of_r(r):
    return 4 * pi * r**2 * rho_mass * (1 - (1 / math.sqrt(1 - schwarzschild_radius(r))))

def model(P, r):
    rho = pow((P/k), (1/gamma))
    mass = m_of_r(r)
    
    